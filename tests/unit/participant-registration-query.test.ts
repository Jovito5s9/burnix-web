import { describe, expect, it } from "vitest";

import {
  PARTICIPANT_PAYMENT_POLL_DURATION_MS,
  isParticipantPaymentTerminal,
  mergeParticipantPaymentResult,
  participantRegistrationDetailKey,
  shouldPollParticipantRegistration,
} from "@/lib/participant-registration-query";
import {
  buildRegistrationDetail,
  pendingPaymentFixture,
  pendingPublicPaymentFixture,
} from "@/tests/fixtures/participant";

describe("regras da inscrição do participante", () => {
  it("gera uma chave de consulta estável para o detalhe", () => {
    expect(participantRegistrationDetailKey(42)).toEqual([
      "participant-registrations",
      "detail",
      "42",
    ]);
  });

  it("mantém o polling somente enquanto o pagamento está pendente e dentro do limite", () => {
    const startedAt = Date.parse("2026-07-11T12:00:00Z");
    const registration = buildRegistrationDetail({
      payment_status: "pending",
      latest_payment: pendingPaymentFixture,
    });

    expect(
      shouldPollParticipantRegistration(registration, startedAt, startedAt)
    ).toBe(true);
    expect(
      shouldPollParticipantRegistration(
        registration,
        startedAt,
        startedAt + PARTICIPANT_PAYMENT_POLL_DURATION_MS - 1
      )
    ).toBe(true);
    expect(
      shouldPollParticipantRegistration(
        registration,
        startedAt,
        startedAt + PARTICIPANT_PAYMENT_POLL_DURATION_MS
      )
    ).toBe(false);
  });

  it.each(["paid", "expired", "error", "refunded", "not_required"] as const)(
    "interrompe o polling quando o pagamento está %s",
    (status) => {
      const registration = buildRegistrationDetail({
        payment_status: status,
        latest_payment: null,
      });

      expect(isParticipantPaymentTerminal(status)).toBe(true);
      expect(shouldPollParticipantRegistration(registration, 1_000, 2_000)).toBe(
        false
      );
    }
  );

  it("incorpora um Pix retornado pelo backend ao detalhe da inscrição", () => {
    const registration = buildRegistrationDetail({ latest_payment: null });

    expect(
      mergeParticipantPaymentResult(registration, pendingPublicPaymentFixture)
    ).toMatchObject({
      registration_status: "pending_payment",
      payment_status: "pending",
      latest_payment: {
        id: pendingPublicPaymentFixture.id,
        status: "pending",
        copy_and_paste: pendingPublicPaymentFixture.copy_and_paste,
      },
    });
  });

  it("confirma a inscrição gratuita sem criar um pagamento", () => {
    const registration = buildRegistrationDetail();

    expect(
      mergeParticipantPaymentResult(registration, {
        registration_id: registration.id,
        status: "not_required",
        message: "Este evento não exige pagamento.",
      })
    ).toMatchObject({
      registration_status: "confirmed",
      payment_status: "not_required",
      latest_payment: null,
    });
  });
});
