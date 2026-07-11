import type { ContractStatus } from "@/types/contract";
import type { ParticipantPaymentResponse } from "@/types/payment";

export type ParticipantRegistrationStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "expired";

export type ParticipantRegistrationPaymentStatus =
  | "pending"
  | "paid"
  | "expired"
  | "error"
  | "refunded"
  | "not_required";

export type ParticipantRegistrationCreatePayload = {
  name: string;
  phone?: string | null;
  document?: string | null;
  sex?: string | null;
  age?: number | null;
  extra_fields?: Record<string, unknown>;
};

export type ParticipantRegistrationEvent = {
  id: number;
  title: string;
  status: ContractStatus;
  price: string;
  currency: string;
  start_date: string | null;
  end_date: string | null;
};

export type ParticipantRegistrationPayment = {
  id: number;
  attempt_number: number;
  status: Exclude<ParticipantRegistrationPaymentStatus, "not_required">;
  amount: string;
  currency: string;
  checkout_url: string | null;
  qr_code_base64: string | null;
  copy_and_paste: string | null;
  expires_at: string | null;
};

export type ParticipantRegistration = {
  id: number;
  registration_status: ParticipantRegistrationStatus;
  payment_status: ParticipantRegistrationPaymentStatus;
  created_at: string;
  event: ParticipantRegistrationEvent;
  latest_payment: ParticipantRegistrationPayment | null;
};

export type ParticipantRegistrationDetail = ParticipantRegistration & {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  sex: string | null;
  age: number | null;
  extra_fields: Record<string, unknown> | null;
  updated_at: string;
};

export type GenerateParticipantPixResult = ParticipantPaymentResponse;
