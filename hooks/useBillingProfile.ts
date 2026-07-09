"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMyBillingProfile,
  patchMyBillingProfile,
  upsertMyBillingProfile,
} from "@/services/billing-profiles";
import type { BillingProfilePayload } from "@/types/billing-profile";

export function useBillingProfile() {
  return useQuery({
    queryKey: ["billing-profile", "me"],
    queryFn: getMyBillingProfile,
    staleTime: 30 * 1000,
  });
}

export function useUpsertBillingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BillingProfilePayload) => upsertMyBillingProfile(payload),
    onSuccess: async (profile) => {
      queryClient.setQueryData(["billing-profile", "me"], profile);
      await queryClient.invalidateQueries({ queryKey: ["billing-profile"] });
    },
  });
}

export function usePatchBillingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BillingProfilePayload) => patchMyBillingProfile(payload),
    onSuccess: async (profile) => {
      queryClient.setQueryData(["billing-profile", "me"], profile);
      await queryClient.invalidateQueries({ queryKey: ["billing-profile"] });
    },
  });
}
