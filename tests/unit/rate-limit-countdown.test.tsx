import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRateLimitCountdown } from "@/hooks/useRateLimitCountdown";
import { ApiClientError } from "@/lib/get-error-message";

describe("useRateLimitCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("libera uma nova tentativa quando o Retry-After termina", () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-07-11T12:00:00Z");

    const { result } = renderHook(() => useRateLimitCountdown());

    act(() => {
      expect(
        result.current.startFromError(
          new ApiClientError("rate limit", {
            status: 429,
            retryAfterSeconds: 2,
          })
        )
      ).toBe(true);
    });

    expect(result.current.isRateLimited).toBe(true);
    expect(result.current.secondsRemaining).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.secondsRemaining).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.isRateLimited).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
    expect(result.current.message).toBeNull();
  });

  it("ignora erros que não sejam de rate limit", () => {
    const { result } = renderHook(() => useRateLimitCountdown());

    act(() => {
      expect(
        result.current.startFromError(
          new ApiClientError("validation", { status: 422 })
        )
      ).toBe(false);
    });

    expect(result.current.isRateLimited).toBe(false);
  });
});
