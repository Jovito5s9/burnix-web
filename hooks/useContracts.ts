"use client";

import { useQuery } from "@tanstack/react-query";
import { getContract, listContracts } from "@/services/contracts";

export function useContracts() {
  const contractsQuery = useQuery({
    queryKey: ["contracts"],
    queryFn: listContracts,
  });

  return {
    contracts: contractsQuery.data?.items ?? [],
    total: contractsQuery.data?.total ?? 0,
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    refetch: contractsQuery.refetch,
  };
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getContract(id),
    enabled: Boolean(id),
  });
}
