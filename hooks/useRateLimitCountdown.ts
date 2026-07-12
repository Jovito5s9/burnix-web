"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS,
  formatRateLimitMessage,
  getApiRetryAfterSeconds,
  isApiRateLimitError,
} from "@/lib/get-error-message";

export function useRateLimitCountdown() {
  const blockedUntilRef = useRef<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const isRateLimited = secondsRemaining > 0;

  useEffect(() => {
    if (!isRateLimited) return;

    const interval = window.setInterval(() => {
      const blockedUntil = blockedUntilRef.current;
      if (!blockedUntil) {
        setSecondsRemaining(0);
        return;
      }

      const remaining = Math.max(
        0,
        Math.ceil((blockedUntil - Date.now()) / 1000)
      );
      setSecondsRemaining(remaining);

      if (remaining === 0) {
        blockedUntilRef.current = null;
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRateLimited]);

  const startFromError = useCallback((error: unknown) => {
    if (!isApiRateLimitError(error)) return false;

    const retryAfterSeconds =
      getApiRetryAfterSeconds(error) ??
      DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS;

    blockedUntilRef.current = Date.now() + retryAfterSeconds * 1000;
    setSecondsRemaining(retryAfterSeconds);
    return true;
  }, []);

  const reset = useCallback(() => {
    blockedUntilRef.current = null;
    setSecondsRemaining(0);
  }, []);

  const message = useMemo(
    () =>
      isRateLimited ? formatRateLimitMessage(secondsRemaining) : null,
    [isRateLimited, secondsRemaining]
  );

  return {
    isRateLimited,
    secondsRemaining,
    message,
    startFromError,
    reset,
  };
}
