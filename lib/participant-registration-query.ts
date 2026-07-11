import type {
  ParticipantRegistration,
  ParticipantRegistrationDetail,
  ParticipantRegistrationPayment,
  ParticipantRegistrationPaymentStatus,
} from "@/types/participant-registration";
import type {
  ParticipantPaymentResponse,
  PublicPaymentRead,
} from "@/types/payment";

export const participantRegistrationsKey = ["participant-registrations"] as const;

export function participantRegistrationDetailKey(id: string | number) {
  return [...participantRegistrationsKey, "detail", String(id)] as const;
}

export const PARTICIPANT_PAYMENT_POLL_INTERVAL_MS = 4_500;
export const PARTICIPANT_PAYMENT_POLL_DURATION_MS = 3 * 60 * 1_000;

export function isParticipantPaymentTerminal(
  status: ParticipantRegistrationPaymentStatus
) {
  return (
    status === "paid" ||
    status === "expired" ||
    status === "error" ||
    status === "refunded" ||
    status === "not_required"
  );
}

export function shouldPollParticipantRegistration(
  registration: ParticipantRegistration | ParticipantRegistrationDetail | undefined,
  startedAt: number,
  now = Date.now()
) {
  if (!registration) return false;

  const paymentStatus =
    registration.latest_payment?.status ?? registration.payment_status;

  return (
    paymentStatus === "pending" &&
    !isParticipantPaymentTerminal(paymentStatus) &&
    now - startedAt < PARTICIPANT_PAYMENT_POLL_DURATION_MS
  );
}

export function isPublicPaymentRead(
  result: ParticipantPaymentResponse
): result is PublicPaymentRead {
  return result.status !== "not_required";
}

export function toParticipantRegistrationPayment(
  payment: PublicPaymentRead
): ParticipantRegistrationPayment {
  return {
    id: payment.id,
    attempt_number: payment.attempt_number,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    checkout_url: payment.checkout_url,
    qr_code_base64: payment.qr_code_base64,
    copy_and_paste: payment.copy_and_paste,
    expires_at: payment.expires_at,
  };
}

export function mergeParticipantPaymentResult<T extends ParticipantRegistration>(
  registration: T,
  result: ParticipantPaymentResponse
): T {
  if (!isPublicPaymentRead(result)) {
    return {
      ...registration,
      registration_status: "confirmed",
      payment_status: "not_required",
      latest_payment: null,
    };
  }

  return {
    ...registration,
    payment_status: result.status,
    registration_status:
      result.status === "paid" ? "confirmed" : registration.registration_status,
    latest_payment: toParticipantRegistrationPayment(result),
  };
}
