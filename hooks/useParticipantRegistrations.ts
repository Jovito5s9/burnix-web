"use client";

import { useQuery } from "@tanstack/react-query";

import { useCreateParticipantRegistrationPixPayment } from "@/hooks/usePayments";
import { useParticipantPaymentPolling } from "@/hooks/useParticipantPaymentPolling";
import {
  participantRegistrationsKey,
} from "@/lib/participant-registration-query";
import { listMyRegistrations } from "@/services/participant-registrations";
import type { PaymentStatus } from "@/types/payment";

export { participantRegistrationDetailKey } from "@/lib/participant-registration-query";
export { participantRegistrationsKey } from "@/lib/participant-registration-query";

export function useParticipantRegistrations() {
  const query = useQuery({
    queryKey: participantRegistrationsKey,
    queryFn: listMyRegistrations,
    staleTime: 30 * 1000,
  });

  return {
    registrations: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useParticipantRegistration(id: string | number) {
  return useParticipantPaymentPolling(id, true);
}

export function useGenerateParticipantRegistrationPix() {
  return useCreateParticipantRegistrationPixPayment();
}

export function isFinalParticipantPaymentStatus(
  status: PaymentStatus | "not_required"
) {
  return (
    status === "paid" ||
    status === "expired" ||
    status === "error" ||
    status === "refunded" ||
    status === "not_required"
  );
}
