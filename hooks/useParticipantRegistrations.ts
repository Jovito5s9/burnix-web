"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  generateParticipantRegistrationPix,
  getMyRegistration,
  listMyRegistrations,
} from "@/services/participant-registrations";
import type {
  ParticipantRegistration,
  ParticipantRegistrationDetail,
  ParticipantRegistrationPayment,
} from "@/types/participant-registration";
import type {
  ParticipantPaymentCreatePayload,
  ParticipantPaymentResponse,
  PublicPaymentRead,
} from "@/types/payment";

export const participantRegistrationsKey = ["participant-registrations"] as const;

export function participantRegistrationDetailKey(id: string | number) {
  return [...participantRegistrationsKey, "detail", String(id)] as const;
}

function isPublicPaymentRead(
  result: ParticipantPaymentResponse
): result is PublicPaymentRead {
  return result.status !== "not_required";
}

function toRegistrationPayment(
  payment: PublicPaymentRead
): ParticipantRegistrationPayment {
  return {
    id: payment.id,
    attempt_number: payment.attempt_number,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    checkout_url: payment.checkout_url,
    qr_code_base64: payment.qr_code_base64,
    copy_and_paste: payment.copy_and_paste,
    expires_at: payment.expires_at,
  };
}

function mergePaymentResult<T extends ParticipantRegistration>(
  registration: T,
  result: ParticipantPaymentResponse
): T {
  if (!isPublicPaymentRead(result)) {
    return {
      ...registration,
      registration_status: "confirmed",
      payment_status: "not_required",
      latest_payment: null,
    };
  }

  return {
    ...registration,
    payment_status: result.status,
    registration_status:
      result.status === "paid" ? "confirmed" : registration.registration_status,
    latest_payment: toRegistrationPayment(result),
  };
}

export function useParticipantRegistrations() {
  const query = useQuery({
    queryKey: participantRegistrationsKey,
    queryFn: listMyRegistrations,
    staleTime: 30 * 1000,
  });

  return {
    registrations: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useParticipantRegistration(id: string | number) {
  const normalizedId = String(id);

  return useQuery({
    queryKey: participantRegistrationDetailKey(normalizedId),
    queryFn: () => getMyRegistration(normalizedId),
    enabled: /^\d+$/.test(normalizedId),
    staleTime: 30 * 1000,
  });
}

export function useGenerateParticipantRegistrationPix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registrationId,
      payload,
    }: {
      registrationId: string | number;
      payload?: ParticipantPaymentCreatePayload;
    }) => generateParticipantRegistrationPix(registrationId, payload ?? {}),
    onSuccess: (result, variables) => {
      const registrationId = String(variables.registrationId);

      queryClient.setQueryData<ParticipantRegistrationDetail>(
        participantRegistrationDetailKey(registrationId),
        (current) => (current ? mergePaymentResult(current, result) : current)
      );

      queryClient.setQueryData<ParticipantRegistration[]>(
        participantRegistrationsKey,
        (current) =>
          current?.map((registration) =>
            String(registration.id) === registrationId
              ? mergePaymentResult(registration, result)
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
