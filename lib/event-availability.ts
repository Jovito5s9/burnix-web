import type { RegistrationAvailabilityState } from "@/types/public-contract";

export type RegistrationClosure = {
  reason: Exclude<RegistrationAvailabilityState, "open">;
  message: string;
};

const CLOSED_MESSAGES: Record<
  Exclude<RegistrationAvailabilityState, "open">,
  string
> = {
  deadline_passed: "As inscrições para este evento foram encerradas.",
  capacity_reached: "As vagas disponíveis para este evento foram preenchidas.",
  event_closed: "Este evento já foi encerrado.",
  event_cancelled: "Este evento foi cancelado.",
  event_not_published: "Este evento não está disponível para inscrições.",
  not_started: "As inscrições para este evento ainda não foram iniciadas.",
};

export function getRegistrationClosedMessage(
  reason: Exclude<RegistrationAvailabilityState, "open">,
  backendMessage?: string | null
) {
  const normalizedMessage = backendMessage?.trim();
  return normalizedMessage || CLOSED_MESSAGES[reason];
}

export function getRegistrationClosedTitle(
  reason: Exclude<RegistrationAvailabilityState, "open">
) {
  switch (reason) {
    case "capacity_reached":
      return "Vagas preenchidas";
    case "event_cancelled":
      return "Evento cancelado";
    case "event_closed":
      return "Evento encerrado";
    case "not_started":
      return "Inscrições ainda não iniciadas";
    case "event_not_published":
      return "Inscrições indisponíveis";
    case "deadline_passed":
    default:
      return "Inscrições encerradas";
  }
}

export function getRegistrationClosureFromApiCode(
  code: string | undefined,
  message?: string | null
): RegistrationClosure | null {
  if (code === "event_registration_closed") {
    return {
      reason: "deadline_passed",
      message: getRegistrationClosedMessage("deadline_passed", message),
    };
  }

  if (code === "event_capacity_reached") {
    return {
      reason: "capacity_reached",
      message: getRegistrationClosedMessage("capacity_reached", message),
    };
  }

  return null;
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function calculateServerClockOffset(
  serverTime: string,
  sampledAtMs = Date.now()
) {
  const serverTimestamp = parseTimestamp(serverTime);
  if (serverTimestamp === null) return 0;
  return serverTimestamp - sampledAtMs;
}

export function getMillisecondsUntilRegistrationDeadline({
  registrationDeadline,
  serverTime,
  sampledAtMs,
  nowMs = Date.now(),
}: {
  registrationDeadline: string | null;
  serverTime: string;
  sampledAtMs: number;
  nowMs?: number;
}) {
  const deadlineTimestamp = parseTimestamp(registrationDeadline);
  if (deadlineTimestamp === null) return null;

  const serverClockOffset = calculateServerClockOffset(serverTime, sampledAtMs);
  const estimatedServerNow = nowMs + serverClockOffset;
  return deadlineTimestamp - estimatedServerNow;
}

export function isRegistrationDeadlineReached(options: {
  registrationDeadline: string | null;
  serverTime: string;
  sampledAtMs: number;
  nowMs?: number;
}) {
  const remaining = getMillisecondsUntilRegistrationDeadline(options);
  return remaining !== null && remaining <= 0;
}
