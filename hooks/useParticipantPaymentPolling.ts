"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  PARTICIPANT_PAYMENT_POLL_INTERVAL_MS,
  participantRegistrationDetailKey,
  shouldPollParticipantRegistration,
} from "@/lib/participant-registration-query";
import { getMyRegistration } from "@/services/participant-registrations";

function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

export function useParticipantPaymentPolling(
  registrationId: string | number | null | undefined,
  enabled = true
) {
  const normalizedId = registrationId == null ? "" : String(registrationId);
  const pollingStartedAtRef = useRef(0);

  useEffect(() => {
    pollingStartedAtRef.current = 0;
  }, [normalizedId, enabled]);

  return useQuery({
    queryKey: participantRegistrationDetailKey(normalizedId),
    queryFn: () => getMyRegistration(normalizedId),
    enabled: enabled && /^\d+$/.test(normalizedId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      if (!isPageVisible()) return false;

      const now = Date.now();
      if (pollingStartedAtRef.current === 0) {
        pollingStartedAtRef.current = now;
      }

      return shouldPollParticipantRegistration(
        query.state.data,
        pollingStartedAtRef.current,
        now
      )
        ? PARTICIPANT_PAYMENT_POLL_INTERVAL_MS
        : false;
    },
  });
}
