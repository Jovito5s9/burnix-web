import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PARTICIPANT_PAYMENT_POLL_INTERVAL_MS,
} from "@/lib/participant-registration-query";
import {
  buildRegistrationDetail,
  pendingPaymentFixture,
} from "@/tests/fixtures/participant";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  getMyRegistration: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
}));

vi.mock("@/services/participant-registrations", () => ({
  getMyRegistration: mocks.getMyRegistration,
}));

import { useParticipantPaymentPolling } from "@/hooks/useParticipantPaymentPolling";

type CapturedQueryOptions = {
  enabled: boolean;
  refetchIntervalInBackground: boolean;
  queryFn: () => Promise<unknown>;
  refetchInterval: (query: {
    state: { data: ReturnType<typeof buildRegistrationDetail> };
  }) => number | false;
};

const originalVisibilityDescriptor = Object.getOwnPropertyDescriptor(
  document,
  "visibilityState"
);

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
}

describe("useParticipantPaymentPolling", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.getMyRegistration.mockReset();
    mocks.useQuery.mockImplementation((options) => options);
  });

  afterEach(() => {
    if (originalVisibilityDescriptor) {
      Object.defineProperty(
        document,
        "visibilityState",
        originalVisibilityDescriptor
      );
    }
  });

  it("consulta a inscrição pendente e interrompe o intervalo com a página oculta", async () => {
    setVisibility("visible");
    const registration = buildRegistrationDetail({
      payment_status: "pending",
      latest_payment: pendingPaymentFixture,
    });
    mocks.getMyRegistration.mockResolvedValue(registration);

    const { result } = renderHook(() => useParticipantPaymentPolling(42));
    const options = result.current as unknown as CapturedQueryOptions;

    expect(options.enabled).toBe(true);
    expect(options.refetchIntervalInBackground).toBe(false);
    expect(options.refetchInterval({ state: { data: registration } })).toBe(
      PARTICIPANT_PAYMENT_POLL_INTERVAL_MS
    );

    setVisibility("hidden");
    expect(options.refetchInterval({ state: { data: registration } })).toBe(
      false
    );

    await expect(options.queryFn()).resolves.toEqual(registration);
    expect(mocks.getMyRegistration).toHaveBeenCalledWith("42");
  });

  it("não habilita a consulta quando o identificador é inválido", () => {
    const { result } = renderHook(() =>
      useParticipantPaymentPolling("registration-42")
    );
    const options = result.current as unknown as CapturedQueryOptions;

    expect(options.enabled).toBe(false);
  });
});
