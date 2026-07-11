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
  | "refunded"
  | "not_required";

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

export type RegistrationAlreadyExistsErrorDetail = {
  code: "registration_already_exists";
  message: string;
  registration_id: number;
  can_resume_payment: boolean;
};

export type RegistrationRecoveryContext = {
  registrationId: number;
  canResumePayment: boolean;
};

/** @deprecated Use ParticipantRegistrationCreatePayload from @/types/participant-registration. */
export type PublicRegistrationPayload = {
  name: string;
  phone?: string | null;
  document?: string | null;
  sex?: string | null;
  age?: number | null;
  extra_fields?: Record<string, unknown>;
};
