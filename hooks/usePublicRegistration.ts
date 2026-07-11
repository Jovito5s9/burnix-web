"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isApiNetworkError } from "@/lib/get-error-message";
import {
  createPublicEventRegistration,
  generatePublicEventRegistrationPix,
  getPublicEventRegistration,
} from "@/services/public-contracts";
import type {
  ParticipantRegistrationCreatePayload,
  ParticipantRegistrationDetail,
} from "@/types/participant-registration";

const participantRegistrationsKey = ["participant-registrations"] as const;

function participantRegistrationDetailKey(id: string | number) {
  return [...participantRegistrationsKey, "detail", String(id)] as const;
}

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registrationId,
      idempotencyKey,
    }: {
      registrationId: string | number;
      idempotencyKey: string;
    }) =>
      generatePublicEventRegistrationPix(registrationId, {
        idempotency_key: idempotencyKey,
      }),
    retry: (failureCount, error) =>
      isApiNetworkError(error) && failureCount < 2,
    retryDelay: (attemptIndex) => Math.min(750 * 2 ** attemptIndex, 3_000),
    onSuccess: async (_result, variables) => {
      await invalidateRegistrationQueries(
        queryClient,
        undefined,
        variables.registrationId
      );
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
