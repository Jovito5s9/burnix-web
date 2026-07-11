import type { ContractStatus } from "@/types/contract";
import type { PaymentStatus } from "@/types/payment";
import type {
  RegistrationPaymentStatus,
  RegistrationStatus,
} from "@/types/registration";

export type Participant = {
  id: number;
  email: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ParticipantRegistrationCreatePayload = {
  name: string;
  phone?: string | null;
  document?: string | null;
  sex?: string | null;
  age?: number | null;
  extra_fields?: Record<string, unknown>;
};

export type ParticipantEventSummary = {
  id: number;
  title: string;
  status: ContractStatus;
  price: string;
  currency: string;
  start_date: string | null;
  end_date: string | null;
};

export type ParticipantPaymentSummary = {
  id: number;
  attempt_number: number;
  status: PaymentStatus;
  amount: string;
  currency: string;
  checkout_url: string | null;
  qr_code_base64: string | null;
  copy_and_paste: string | null;
  expires_at: string | null;
};

export type ParticipantRegistrationListItem = {
  id: number;
  registration_status: RegistrationStatus;
  payment_status: RegistrationPaymentStatus;
  created_at: string;
  event: ParticipantEventSummary;
  latest_payment: ParticipantPaymentSummary | null;
};

export type ParticipantRegistrationDetail = ParticipantRegistrationListItem & {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  sex: string | null;
  age: number | null;
  extra_fields: Record<string, unknown> | null;
  updated_at: string;
};
