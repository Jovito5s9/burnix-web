"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContract,
  deleteContract,
  getContract,
  listContractPayments,
  listContractRegistrations,
  listContracts,
  runContractStatusAction,
  updateContract,
} from "@/services/contracts";
import type {
  Contract,
  ContractActionPayload,
  ContractCreatePayload,
  ContractListParams,
  ContractStatusAction,
  ContractUpdatePayload,
} from "@/types/contract";

function contractListKey(params?: ContractListParams) {
  return ["contracts", params ?? {}] as const;
}

function useSyncContractCache() {
  const queryClient = useQueryClient();

  return async (contract: Contract) => {
    queryClient.setQueryData(["contracts", contract.id], contract);
    await queryClient.invalidateQueries({ queryKey: ["contracts"] });
  };
}

export function useContracts(params?: ContractListParams) {
  const contractsQuery = useQuery({
    queryKey: contractListKey(params),
    queryFn: () => listContracts(params),
    staleTime: 30 * 1000,
  });

  return {
    contracts: contractsQuery.data?.items ?? [],
    total: contractsQuery.data?.total ?? 0,
    skip: contractsQuery.data?.skip ?? params?.skip ?? 0,
    limit: contractsQuery.data?.limit ?? params?.limit ?? 0,
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
  const syncContractCache = useSyncContractCache();

  return useMutation({
    mutationFn: (payload: ContractCreatePayload) => createContract(payload),
    onSuccess: syncContractCache,
  });
}

export function useUpdateContract(id: string | number) {
  const syncContractCache = useSyncContractCache();

  return useMutation({
    mutationFn: (payload: ContractUpdatePayload) => updateContract(id, payload),
    onSuccess: syncContractCache,
  });
}

export function useContractStatusAction(
  id: string | number,
  action: ContractStatusAction
) {
  const syncContractCache = useSyncContractCache();

  return useMutation({
    mutationFn: (payload: ContractActionPayload) =>
      runContractStatusAction(id, action, payload),
    onSuccess: syncContractCache,
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteContract(id),
    onSuccess: async (_data, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.removeQueries({ queryKey: ["contracts", deletedId] });
    },
  });
}

export function useContract(id: string | number) {
  return useContractById(id);
}
