"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCheckout } from "@/services/checkout";
import type { CreateCheckoutPayload } from "@/types/checkout";

export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCheckoutPayload) => createCheckout(payload),
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["payments", variables.contractId] });
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      await queryClient.invalidateQueries({ queryKey: ["contracts", variables.contractId] });
    },
  });
}
