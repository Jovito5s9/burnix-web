"use client";

import { useQuery } from "@tanstack/react-query";

import { getPublicContract } from "@/services/public-contracts";

export function usePublicContract(contractId: string | number) {
  return useQuery({
    queryKey: ["public-contracts", contractId],
    queryFn: () => getPublicContract(contractId),
    enabled: Boolean(contractId),
    staleTime: 30 * 1000,
  });
}
