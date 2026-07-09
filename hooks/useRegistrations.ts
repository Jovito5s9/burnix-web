"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPublicRegistration,
  createRegistrationPixPayment,
  listContractRegistrations,
} from "@/services/registrations";
import type {
  CreateRegistrationPixPayload,
} from "@/types/payment";
import type { PublicRegistrationPayload } from "@/types/registration";

export function useContractRegistrations(contractId: string | number) {
  return useQuery({
    queryKey: ["registrations", contractId],
    queryFn: () => listContractRegistrations(contractId),
    enabled: Boolean(contractId),
    staleTime: 30 * 1000,
  });
}

export function useCreatePublicRegistration(contractId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PublicRegistrationPayload) =>
      createPublicRegistration(contractId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["registrations", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "registrations"],
      });
    },
  });
}

export function useCreateRegistrationPixPayment(clientId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRegistrationPixPayload = {}) =>
      createRegistrationPixPayment(clientId, payload),
    onSettled: async (data) => {
      const contractId = data?.payment.contract_id;
      await queryClient.invalidateQueries({ queryKey: ["payments"] });

      if (contractId) {
        await queryClient.invalidateQueries({
          queryKey: ["registrations", contractId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["contracts", contractId, "registrations"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["contracts", contractId, "payments"],
        });
      }
    },
  });
}
