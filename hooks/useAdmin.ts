"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listAdminClients,
  listAdminEvents,
  listAdminPayments,
  listAdminUsers,
} from "@/services/admin";
import type { AdminListParams } from "@/types/admin";

function adminListKey(resource: string, params?: AdminListParams) {
  return ["admin", resource, params ?? {}] as const;
}

export function useAdminUsers(params?: AdminListParams, enabled = true) {
  return useQuery({
    queryKey: adminListKey("users", params),
    queryFn: () => listAdminUsers(params),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useAdminEvents(params?: AdminListParams, enabled = true) {
  return useQuery({
    queryKey: adminListKey("events", params),
    queryFn: () => listAdminEvents(params),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useAdminClients(params?: AdminListParams, enabled = true) {
  return useQuery({
    queryKey: adminListKey("clients", params),
    queryFn: () => listAdminClients(params),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useAdminPayments(params?: AdminListParams, enabled = true) {
  return useQuery({
    queryKey: adminListKey("payments", params),
    queryFn: () => listAdminPayments(params),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
