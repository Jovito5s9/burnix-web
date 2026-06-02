export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export interface Payment {
  id: number;

  owner_user_id: number;

  contract_id: number;

  provider: string;

  method: string;

  status: PaymentStatus;

  amount: string;

  currency: string;

  platform_fee_percent: string;

  platform_fee_amount: string;

  net_amount: string;

  payer_email: string | null;

  payer_name: string | null;

  payer_document: string | null;

  external_reference: string | null;

  gateway_payment_id: string | null;

  gateway_checkout_id: string | null;

  checkout_url: string | null;

  qr_code: string | null;

  qr_code_base64: string | null;

  raw_payload: unknown | null;

  error_message: string | null;

  paid_at: string | null;

  created_at: string;

  updated_at: string;
}

export interface PaymentCreatePayload {
  contract_id: number;

  method: string;

  amount: string;
}