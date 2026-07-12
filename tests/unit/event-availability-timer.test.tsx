import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEventAvailabilityTimer } from "@/hooks/useEventAvailabilityTimer";

describe("useEventAvailabilityTimer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fecha no prazo calculado pelo horário do servidor", () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-07-12T15:00:00Z");
    const onDeadlineReached = vi.fn();

    const { result } = renderHook(() =>
      useEventAvailabilityTimer({
        registrationOpen: true,
        registrationDeadline: "2026-07-12T12:00:02Z",
        serverTime: "2026-07-12T12:00:00Z",
        sampledAtMs: Date.parse("2026-07-12T15:00:00Z"),
        onDeadlineReached,
      })
    );

    expect(result.current.deadlineReached).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(onDeadlineReached).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.deadlineReached).toBe(true);
    expect(onDeadlineReached).toHaveBeenCalledTimes(1);
  });
});
