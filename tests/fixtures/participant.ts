import type { Participant } from "@/types/participant";
import type {
  ParticipantRegistration,
  ParticipantRegistrationDetail,
  ParticipantRegistrationPayment,
} from "@/types/participant-registration";
import type { PublicContract } from "@/types/public-contract";
import type { PublicPaymentRead } from "@/types/payment";

export const participantFixture: Participant = {
  id: 7,
  email: "participante.a@example.com",
  is_active: true,
  email_verified_at: null,
  created_at: "2026-07-10T10:00:00Z",
  updated_at: "2026-07-10T10:00:00Z",
};

export const publicEventFixture: PublicContract = {
  id: 10,
  title: "Corrida Burnix 2026",
  description: "Evento esportivo com inscrição online.",
  status: "published",
  price: "100.00",
  currency: "BRL",
  capacity: 500,
  start_date: "2026-08-10",
  end_date: "2026-08-10",
  registration_deadline: "2026-08-05T23:59:59Z",
  form_fields: [],
};

export const pendingPaymentFixture: ParticipantRegistrationPayment = {
  id: 87,
  attempt_number: 1,
  status: "pending",
  amount: "100.00",
  currency: "BRL",
  checkout_url: "https://checkout.example/pix/87",
  qr_code_base64: "ZmFrZS1xci1jb2Rl",
  copy_and_paste: "00020126580014BR.GOV.BCB.PIX0136burnix-pix-code",
  expires_at: "2026-07-11T18:00:00Z",
};

export const pendingPublicPaymentFixture: PublicPaymentRead = {
  id: pendingPaymentFixture.id,
  registration_id: 42,
  attempt_number: pendingPaymentFixture.attempt_number,
  status: pendingPaymentFixture.status,
  amount: pendingPaymentFixture.amount,
  currency: pendingPaymentFixture.currency,
  checkout_url: pendingPaymentFixture.checkout_url,
  qr_code_base64: pendingPaymentFixture.qr_code_base64,
  copy_and_paste: pendingPaymentFixture.copy_and_paste,
  expires_at: pendingPaymentFixture.expires_at,
};

export function buildRegistrationDetail(
  overrides: Partial<ParticipantRegistrationDetail> = {}
): ParticipantRegistrationDetail {
  return {
    id: 42,
    registration_status: "pending_payment",
    payment_status: "pending",
    created_at: "2026-07-11T12:00:00Z",
    updated_at: "2026-07-11T12:00:00Z",
    name: "Participante A",
    email: participantFixture.email,
    phone: "+5591999999999",
    document: "12345678900",
    sex: null,
    age: 30,
    extra_fields: null,
    event: {
      id: publicEventFixture.id,
      title: publicEventFixture.title,
      status: publicEventFixture.status,
      price: publicEventFixture.price,
      currency: publicEventFixture.currency,
      start_date: publicEventFixture.start_date,
      end_date: publicEventFixture.end_date,
    },
    latest_payment: null,
    ...overrides,
  };
}

export function buildRegistrationListItem(
  overrides: Partial<ParticipantRegistration> = {}
): ParticipantRegistration {
  const detail = buildRegistrationDetail();

  return {
    id: detail.id,
    registration_status: detail.registration_status,
    payment_status: detail.payment_status,
    created_at: detail.created_at,
    event: detail.event,
    latest_payment: detail.latest_payment,
    ...overrides,
  };
}
