"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getMillisecondsUntilRegistrationDeadline } from "@/lib/event-availability";

const MAX_TIMEOUT_MS = 2_147_000_000;

type UseEventAvailabilityTimerOptions = {
  registrationOpen: boolean;
  registrationDeadline: string | null;
  serverTime: string;
  sampledAtMs: number;
  onDeadlineReached?: () => void | Promise<void>;
};

export function useEventAvailabilityTimer({
  registrationOpen,
  registrationDeadline,
  serverTime,
  sampledAtMs,
  onDeadlineReached,
}: UseEventAvailabilityTimerOptions) {
  const [reachedTimerIdentity, setReachedTimerIdentity] = useState<string | null>(
    null
  );
  const callbackRef = useRef(onDeadlineReached);

  useEffect(() => {
    callbackRef.current = onDeadlineReached;
  }, [onDeadlineReached]);

  const timerIdentity = useMemo(
    () =>
      [
        registrationOpen ? "open" : "closed",
        registrationDeadline ?? "no-deadline",
        serverTime,
        sampledAtMs,
      ].join(":"),
    [registrationDeadline, registrationOpen, sampledAtMs, serverTime]
  );

  useEffect(() => {
    if (!registrationOpen || !registrationDeadline) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const notifyDeadlineReached = () => {
      if (cancelled) return;
      setReachedTimerIdentity(timerIdentity);
      void callbackRef.current?.();
    };

    const schedule = () => {
      const remaining = getMillisecondsUntilRegistrationDeadline({
        registrationDeadline,
        serverTime,
        sampledAtMs,
      });

      if (remaining === null) return;
      if (remaining <= 0) {
        notifyDeadlineReached();
        return;
      }

      timer = setTimeout(schedule, Math.min(remaining, MAX_TIMEOUT_MS));
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    registrationDeadline,
    registrationOpen,
    sampledAtMs,
    serverTime,
    timerIdentity,
  ]);

  return {
    deadlineReached: reachedTimerIdentity === timerIdentity,
  };
}
