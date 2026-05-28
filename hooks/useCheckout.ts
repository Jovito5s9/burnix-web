"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCheckout } from "@/services/checkout";
import type {
  CreateCheckoutPayload,
  CheckoutResponse,
} from "@/types/checkout";

export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation<
    CheckoutResponse,
    Error,
    CreateCheckoutPayload
  >({
    mutationFn: createCheckout,

    onSettled: async (
      _data,
      _error,
      variables
    ) => {
      await queryClient.invalidateQueries({
        queryKey: ["payments"],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "payments",
          variables.contract_id,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: ["contracts"],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "contracts",
          variables.contract_id,
        ],
      });
    },
  });
}