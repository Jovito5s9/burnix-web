"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getPublicContract,
  publicContractQueryKey,
} from "@/services/public-contracts";

export function usePublicContract(contractId: string | number) {
  return useQuery({
    queryKey: publicContractQueryKey(contractId),
    queryFn: () => getPublicContract(contractId),
    enabled: Boolean(contractId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
