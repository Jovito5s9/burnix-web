"use client";

import { useQuery } from "@tanstack/react-query";

import { listContractRegistrations } from "@/services/registrations";

export function useContractRegistrations(contractId: string | number) {
  return useQuery({
    queryKey: ["registrations", contractId],
    queryFn: () => listContractRegistrations(contractId),
    enabled: Boolean(contractId),
    staleTime: 30 * 1000,
  });
}
