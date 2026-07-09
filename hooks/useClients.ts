"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient,
} from "@/services/clients";
import type {
  ClientCreatePayload,
  ClientListParams,
  ClientUpdatePayload,
} from "@/types/client";

function clientListKey(params?: ClientListParams) {
  return ["clients", params ?? {}] as const;
}

export function useClients(params?: ClientListParams) {
  const clientsQuery = useQuery({
    queryKey: clientListKey(params),
    queryFn: () => listClients(params),
    staleTime: 30 * 1000,
  });

  return {
    clients: clientsQuery.data ?? [],
    total: clientsQuery.data?.length ?? 0,
    isLoading: clientsQuery.isLoading,
    isFetching: clientsQuery.isFetching,
    error: clientsQuery.error,
    refetch: clientsQuery.refetch,
  };
}

export function useClientById(id: string | number) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => getClient(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientCreatePayload) => createClient(payload),
    onSuccess: async (client) => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });

      if (client.contract_id) {
        await queryClient.invalidateQueries({
          queryKey: ["registrations", client.contract_id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["contracts", client.contract_id, "registrations"],
        });
      }
    },
  });
}

export function useUpdateClient(id: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientUpdatePayload) => updateClient(id, payload),
    onSuccess: async (client) => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["clients", id] });

      if (client.contract_id) {
        await queryClient.invalidateQueries({
          queryKey: ["registrations", client.contract_id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["contracts", client.contract_id, "registrations"],
        });
      }
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteClient(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
  });
}
