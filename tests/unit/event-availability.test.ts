import { describe, expect, it } from "vitest";

import {
  calculateServerClockOffset,
  getMillisecondsUntilRegistrationDeadline,
  getRegistrationClosedMessage,
  getRegistrationClosureFromApiCode,
} from "@/lib/event-availability";

describe("event availability", () => {
  it("calcula o prazo usando o relógio do servidor, não o relógio local", () => {
    const sampledAtMs = Date.parse("2026-07-12T15:00:00Z");

    expect(
      calculateServerClockOffset("2026-07-12T12:00:00Z", sampledAtMs)
    ).toBe(-3 * 60 * 60 * 1000);

    expect(
      getMillisecondsUntilRegistrationDeadline({
        registrationDeadline: "2026-07-12T12:00:45Z",
        serverTime: "2026-07-12T12:00:00Z",
        sampledAtMs,
        nowMs: sampledAtMs + 15_000,
      })
    ).toBe(30_000);
  });

  it("usa mensagens estáveis quando o backend não envia uma mensagem", () => {
    expect(getRegistrationClosedMessage("deadline_passed")).toBe(
      "As inscrições para este evento foram encerradas."
    );
    expect(getRegistrationClosedMessage("capacity_reached")).toBe(
      "As vagas disponíveis para este evento foram preenchidas."
    );
    expect(getRegistrationClosedMessage("event_closed")).toBe(
      "Este evento já foi encerrado."
    );
    expect(getRegistrationClosedMessage("event_cancelled")).toBe(
      "Este evento foi cancelado."
    );
  });

  it("converte erros concorrentes do POST em estados de disponibilidade", () => {
    expect(
      getRegistrationClosureFromApiCode("event_registration_closed")
    ).toEqual({
      reason: "deadline_passed",
      message: "As inscrições para este evento foram encerradas.",
    });

    expect(getRegistrationClosureFromApiCode("event_capacity_reached")).toEqual(
      {
        reason: "capacity_reached",
        message: "As vagas disponíveis para este evento foram preenchidas.",
      }
    );
  });
});
