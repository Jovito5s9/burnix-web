"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayment, listPayments } from "@/services/payments";

export function usePayments() {
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: listPayments,
  });

  return {
    payments: paymentsQuery.data?.items ?? [],
    total: paymentsQuery.data?.total ?? 0,
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
  };
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => getPayment(id),
    enabled: Boolean(id),
  });
}
