export type PaymentStatus =
  | "pending"
  | "paid"
  | "expired"
  | "error"
  | "refunded";

/** Visão interna, restrita às telas autenticadas do organizador. */
export type Payment = {
  id: number;
  owner_user_id: number;
  contract_id: number;
  client_id: number | null;

  provider: string;
  method: string;
  status: PaymentStatus;
  status_detail: string | null;

  amount: string;
  currency: string;
  platform_fee_percent: string;
  platform_fee_amount: string;
  net_amount: string;

  payer_email: string | null;
  payer_name: string | null;
  payer_document: string | null;

  idempotency_key: string | null;
  correlation_id: string | null;
  external_reference: string | null;
  openpix_charge_id: string | null;
  gateway_payment_id: string | null;
  gateway_checkout_id: string | null;
  payment_method: string | null;

  checkout_url: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  copy_and_paste: string | null;

  raw_payload: Record<string, unknown> | null;
  error_message: string | null;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateContractPixPayload = {
  contract_id: number;
  payer_email: string;
  payer_name?: string;
  payer_document?: string;
  client_id?: number;
  idempotency_key?: string;
};

export type CreateContractCheckoutPayload = {
  contract_id: number;
  payer_email: string;
  payer_name?: string;
  client_id?: number;
  idempotency_key?: string;
};


export type PaymentPixResponse = {
  payment: Payment;
  checkout_url: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  copy_and_paste: string | null;
};

export type PaymentListParams = {
  skip?: number;
  limit?: number;
};


export type ParticipantPaymentCreatePayload = {
  idempotency_key?: string;
};

/** Resposta pública segura: não contém PII, correlação ou IDs do gateway. */
export type PublicPaymentRead = {
  id: number;
  registration_id: number;
  attempt_number: number;
  status: PaymentStatus;
  amount: string;
  currency: string;
  checkout_url: string | null;
  qr_code_base64: string | null;
  copy_and_paste: string | null;
  expires_at: string | null;
};

export type PublicPaymentNotRequired = {
  registration_id: number;
  status: "not_required";
  message: string;
};

export type ParticipantPaymentResponse =
  | PublicPaymentRead
  | PublicPaymentNotRequired;
