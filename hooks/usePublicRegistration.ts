"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCreateParticipantRegistrationPixPayment } from "@/hooks/usePayments";
import { useParticipantPaymentPolling } from "@/hooks/useParticipantPaymentPolling";
import {
  participantRegistrationDetailKey,
  participantRegistrationsKey,
} from "@/lib/participant-registration-query";
import {
  createPublicEventRegistration,
  getPublicEventRegistration,
} from "@/services/public-contracts";
import type {
  ParticipantRegistrationCreatePayload,
  ParticipantRegistrationDetail,
} from "@/types/participant-registration";

async function invalidateRegistrationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  contractId?: string | number,
  registrationId?: string | number
) {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: participantRegistrationsKey }),
  ];

  if (contractId !== undefined) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: ["public-contracts", contractId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["registrations", contractId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "registrations"],
      })
    );
  }

  if (registrationId !== undefined) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: participantRegistrationDetailKey(registrationId),
      })
    );
  }

  await Promise.all(invalidations);
}

export function useCreateParticipantRegistration(contractId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ParticipantRegistrationCreatePayload) =>
      createPublicEventRegistration(contractId, payload),
    onSuccess: async (registration) => {
      queryClient.setQueryData<ParticipantRegistrationDetail>(
        participantRegistrationDetailKey(registration.id),
        registration
      );
      await invalidateRegistrationQueries(queryClient, contractId);
    },
  });
}

export function useRecoverParticipantRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string | number) =>
      getPublicEventRegistration(registrationId),
    onSuccess: (registration) => {
      queryClient.setQueryData<ParticipantRegistrationDetail>(
        participantRegistrationDetailKey(registration.id),
        registration
      );
    },
  });
}

export function useCreateParticipantRegistrationPix() {
  return useCreateParticipantRegistrationPixPayment();
}

export function usePollParticipantRegistrationPayment(
  registrationId: string | number | null | undefined,
  enabled = true
) {
  return useParticipantPaymentPolling(registrationId, enabled);
}
