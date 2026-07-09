"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPublicRegistration,
  createRegistrationPix,
} from "@/services/public-contracts";
import type { CreateRegistrationPixPayload } from "@/types/payment";
import type { PublicRegistrationPayload } from "@/types/registration";

export function useCreatePublicRegistration(contractId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PublicRegistrationPayload) =>
      createPublicRegistration(contractId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-contracts", contractId],
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

export function useCreatePublicRegistrationPix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      payload,
    }: {
      clientId: string | number;
      payload?: CreateRegistrationPixPayload;
    }) => createRegistrationPix(clientId, payload ?? {}),
    onSuccess: async (result) => {
      const contractId = result.payment.contract_id;
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({
        queryKey: ["public-contracts", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["registrations", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "registrations"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "payments"],
      });
    },
  });
}
