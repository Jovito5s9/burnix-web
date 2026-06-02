"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPayment,
  getPayment,
  listPayments,
} from "@/services/payments";

import type {
  Payment,
  PaymentCreatePayload,
} from "@/types/payment";

function appendOptimisticPayment(
  current: Payment[] | undefined,
  optimistic_payment: Payment
): Payment[] {
  return [optimistic_payment, ...(current ?? [])];
}

export function usePayments(contract_id?: string) {
  const payments_query = useQuery({
    queryKey: ["payments", contract_id ?? "all"],
    queryFn: listPayments,
    staleTime: 30 * 1000,
  });

  const payments = contract_id
    ? payments_query.data?.filter(
        (payment) => payment.contract_id === Number(contract_id)
      ) ?? []
    : payments_query.data ?? [];

  return {
    payments,
    total: payments.length,
    isLoading: payments_query.isLoading,
    is_fetching: payments_query.isFetching,
    error: payments_query.error,
    refetch: payments_query.refetch,
  };
}

export function usePaymentById(id: string) {
  return useQuery({
    queryKey: ["payments", "detail", id],
    queryFn: () => getPayment(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useCreatePayment() {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentCreatePayload) =>
      createPayment(payload),

    onMutate: async (payload) => {
      await query_client.cancelQueries({
        queryKey: ["payments"],
      });

      const previous_payments_all =
        query_client.getQueryData<Payment[]>([
          "payments",
          "all",
        ]);

      const previous_payments_by_contract =
        query_client.getQueryData<Payment[]>([
          "payments",
          payload.contract_id,
        ]);

      const optimistic_payment: Payment = {
        id: -Date.now(),
        contract_id: Number(payload.contract_id),
        amount: payload.amount,
        status: "pending",
        method: payload.method,
        created_at: new Date().toISOString(),

        provider: "mercadopago",
        currency: "BRL",

        platform_fee_percent: "0.00",
        platform_fee_amount: "0.00",
        net_amount: payload.amount,

        payer_email: null,
        payer_name: null,
        payer_document: null,

        external_reference: null,

        gateway_payment_id: null,
        gateway_checkout_id: null,

        checkout_url: null,

        qr_code: null,
        qr_code_base64: null,

        error_message: null,

        paid_at: null,

        updated_at: new Date().toISOString(),

        owner_user_id: 0,

        raw_payload: null,
      };

      query_client.setQueryData<Payment[]>(
        ["payments", "all"],
        (current) =>
          appendOptimisticPayment(
            current,
            optimistic_payment
          )
      );

      query_client.setQueryData<Payment[]>(
        ["payments", payload.contract_id],
        (current) =>
          appendOptimisticPayment(
            current,
            optimistic_payment
          )
      );

      return {
        previous_payments_all,
        previous_payments_by_contract,
        contract_id: payload.contract_id,
      };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous_payments_all) {
        query_client.setQueryData(
          ["payments", "all"],
          context.previous_payments_all
        );
      }

      if (
        context?.previous_payments_by_contract &&
        context.contract_id
      ) {
        query_client.setQueryData(
          ["payments", context.contract_id],
          context.previous_payments_by_contract
        );
      }
    },

    onSuccess: (created_payment) => {
      const replaceOptimistic = (
        current: Payment[] | undefined
      ): Payment[] => {
        if (!current) {
          return [created_payment];
        }

        return current.map((payment) =>
          String(payment.id).startsWith(
            "optimistic-"
          ) &&
          payment.contract_id ===
            created_payment.contract_id
            ? created_payment
            : payment
        );
      };

      query_client.setQueryData<Payment[]>(
        ["payments", "all"],
        (current) => replaceOptimistic(current)
      );

      query_client.setQueryData<Payment[]>(
        ["payments", created_payment.contract_id],
        (current) => replaceOptimistic(current)
      );
    },

    onSettled: (_data, _error, variables) => {
      query_client.invalidateQueries({
        queryKey: ["payments"],
      });

      query_client.invalidateQueries({
        queryKey: ["payments", "all"],
      });

      query_client.invalidateQueries({
        queryKey: [
          "payments",
          variables.contract_id,
        ],
      });

      query_client.invalidateQueries({
        queryKey: ["contracts"],
      });

      query_client.invalidateQueries({
        queryKey: [
          "contracts",
          variables.contract_id,
        ],
      });
    },
  });
}

export function usePayment(id: string) {
  return usePaymentById(id);
}