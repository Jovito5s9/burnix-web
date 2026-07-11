"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isApiNetworkError } from "@/lib/get-error-message";
import {
  mergeParticipantPaymentResult,
  participantRegistrationDetailKey,
  participantRegistrationsKey,
} from "@/lib/participant-registration-query";
import {
  createContractPixPayment,
  createParticipantRegistrationPixPayment,
  getPayment,
  listPayments,
} from "@/services/payments";
import type {
  ParticipantRegistration,
  ParticipantRegistrationDetail,
} from "@/types/participant-registration";
import type {
  CreateContractPixPayload,
  ParticipantPaymentCreatePayload,
  PaymentListParams,
} from "@/types/payment";

function paymentListKey(params?: PaymentListParams) {
  return ["payments", params ?? {}] as const;
}

export function usePayments(params?: PaymentListParams) {
  const paymentsQuery = useQuery({
    queryKey: paymentListKey(params),
    queryFn: () => listPayments(params),
    staleTime: 30 * 1000,
  });

  return {
    payments: paymentsQuery.data ?? [],
    total: paymentsQuery.data?.length ?? 0,
    isLoading: paymentsQuery.isLoading,
    is_fetching: paymentsQuery.isFetching,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
  };
}

export function usePaymentById(id: string | number) {
  return useQuery({
    queryKey: ["payments", "detail", id],
    queryFn: () => getPayment(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useCreateContractPixPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContractPixPayload) =>
      createContractPixPayment(payload),
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({
        queryKey: ["payments", "contract", variables.contract_id],
      });
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", variables.contract_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", variables.contract_id, "payments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["registrations", variables.contract_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", variables.contract_id, "registrations"],
      });
    },
  });
}

export function useCreateParticipantRegistrationPixPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registrationId,
      payload = {},
    }: {
      registrationId: string | number;
      payload?: ParticipantPaymentCreatePayload;
    }) => createParticipantRegistrationPixPayment(registrationId, payload),
    retry: (failureCount, error) =>
      isApiNetworkError(error) && failureCount < 2,
    retryDelay: (attemptIndex) => Math.min(750 * 2 ** attemptIndex, 3_000),
    onSuccess: (result, variables) => {
      const registrationId = String(variables.registrationId);

      queryClient.setQueryData<ParticipantRegistrationDetail>(
        participantRegistrationDetailKey(registrationId),
        (current) =>
          current ? mergeParticipantPaymentResult(current, result) : current
      );

      queryClient.setQueryData<ParticipantRegistration[]>(
        participantRegistrationsKey,
        (current) =>
          current?.map((registration) =>
            String(registration.id) === registrationId
              ? mergeParticipantPaymentResult(registration, result)
              : registration
          )
      );
    },
    onSettled: async (_result, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: participantRegistrationsKey,
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: participantRegistrationDetailKey(variables.registrationId),
        }),
      ]);
    },
  });
}

export function usePayment(id: string | number) {
  return usePaymentById(id);
}
