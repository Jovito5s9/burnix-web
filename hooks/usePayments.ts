"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPayment, getPayment, listPayments } from "@/services/payments";
import type { Payment, PaymentCreatePayload, PaymentListResponse } from "@/types/payment";

export function usePayments(contractId?: string) {
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: listPayments,
    staleTime: 30 * 1000,
  });

  const payments = contractId
    ? paymentsQuery.data?.items.filter((payment) => payment.contractId === contractId) ?? []
    : paymentsQuery.data?.items ?? [];

  return {
    payments,
    total: contractId ? payments.length : paymentsQuery.data?.total ?? 0,
    isLoading: paymentsQuery.isLoading,
    isFetching: paymentsQuery.isFetching,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
  };
}

export function usePaymentById(id: string) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => getPayment(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentCreatePayload) => createPayment(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["payments"] });

      const previousPayments = queryClient.getQueryData<PaymentListResponse>(["payments"]);

      const optimisticPayment: Payment = {
        id: `optimistic-${Date.now()}`,
        contractId: payload.contractId,
        amount: payload.amount,
        status: "pending",
        method: payload.method,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PaymentListResponse>(["payments"], (current) => ({
        items: [optimisticPayment, ...(current?.items ?? [])],
        total: (current?.total ?? 0) + 1,
      }));

      return { previousPayments };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(["payments"], context.previousPayments);
      }
    },
    onSuccess: (createdPayment) => {
      queryClient.setQueryData<PaymentListResponse>(["payments"], (current) => {
        if (!current) {
          return { items: [createdPayment], total: 1 };
        }

        return {
          items: current.items.map((payment) =>
            payment.id.startsWith("optimistic-") && payment.contractId === createdPayment.contractId
              ? createdPayment
              : payment
          ),
          total: current.total,
        };
      });
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments", variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts", variables.contractId] });
    },
  });
}

export function usePayment(id: string) {
  return usePaymentById(id);
}
