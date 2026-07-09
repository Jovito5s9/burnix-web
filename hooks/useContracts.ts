"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContract,
  deleteContract,
  getContract,
  listContractPayments,
  listContractRegistrations,
  listContracts,
  updateContract,
} from "@/services/contracts";
import type {
  ContractCreatePayload,
  ContractListParams,
  ContractUpdatePayload,
} from "@/types/contract";

function contractListKey(params?: ContractListParams) {
  return ["contracts", params ?? {}] as const;
}

export function useContracts(params?: ContractListParams) {
  const contractsQuery = useQuery({
    queryKey: contractListKey(params),
    queryFn: () => listContracts(params),
    staleTime: 30 * 1000,
  });

  return {
    contracts: contractsQuery.data ?? [],
    total: contractsQuery.data?.length ?? 0,
    isLoading: contractsQuery.isLoading,
    isFetching: contractsQuery.isFetching,
    error: contractsQuery.error,
    refetch: contractsQuery.refetch,
  };
}

export function useContractById(id: string | number) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getContract(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useContractRegistrations(contractId: string | number) {
  return useQuery({
    queryKey: ["contracts", contractId, "registrations"],
    queryFn: () => listContractRegistrations(contractId),
    enabled: Boolean(contractId),
    staleTime: 30 * 1000,
  });
}

export function useContractPayments(contractId: string | number) {
  return useQuery({
    queryKey: ["contracts", contractId, "payments"],
    queryFn: () => listContractPayments(contractId),
    enabled: Boolean(contractId),
    staleTime: 30 * 1000,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContractCreatePayload) => createContract(payload),
    onSuccess: async (createdContract) => {
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", createdContract.id],
      });
    },
  });
}

export function useUpdateContract(id: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContractUpdatePayload) => updateContract(id, payload),
    onSuccess: async (updatedContract) => {
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", updatedContract.id],
      });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteContract(id),
    onSuccess: async (_data, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      await queryClient.invalidateQueries({ queryKey: ["contracts", deletedId] });
    },
  });
}

export function useContract(id: string | number) {
  return useContractById(id);
}
