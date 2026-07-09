export type RegistrationStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "expired";

export type RegistrationPaymentStatus =
  | "pending"
  | "paid"
  | "expired"
  | "error"
  | "refunded";

export type Registration = {
  id: number;
  contract_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  sex: string | null;
  age: number | null;
  extra_fields: Record<string, unknown> | null;
  registration_status: RegistrationStatus;
  payment_status: RegistrationPaymentStatus;
  created_at: string;
  updated_at: string;
};

export type PublicRegistrationPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  sex?: string | null;
  age?: number | null;
  extra_fields?: Record<string, unknown> | null;
};
