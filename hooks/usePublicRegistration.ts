"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createParticipantRegistration,
  generateParticipantRegistrationPix,
} from "@/services/participant-registrations";
import type { ParticipantRegistrationCreatePayload } from "@/types/participant-registration";
import type { ParticipantPaymentCreatePayload } from "@/types/payment";

export function useCreateParticipantRegistration(contractId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ParticipantRegistrationCreatePayload) =>
      createParticipantRegistration(contractId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-contracts", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["participant-registrations"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["registrations", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "registrations"],
      });
    },
  });
}

export function useCreateParticipantRegistrationPix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registrationId,
      payload,
    }: {
      registrationId: string | number;
      payload?: ParticipantPaymentCreatePayload;
    }) => generateParticipantRegistrationPix(registrationId, payload ?? {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["participant-registrations"],
      });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
