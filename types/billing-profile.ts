export type BillingStatus =
  | "pending"
  | "active"
  | "suspended"
  | "cancelled";

export type PixKeyType =
  | "email"
  | "cpf"
  | "cnpj"
  | "phone"
  | "random"
  | "outro"
  | string;

export type BillingProfile = {
  id: number;
  owner_user_id: number;
  pix_key: string | null;
  pix_key_type: PixKeyType | null;
  recipient_document: string | null;
  recipient_name: string | null;
  billing_status: BillingStatus;
  current_plan: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type BillingProfilePayload = {
  pix_key?: string | null;
  pix_key_type?: PixKeyType | null;
  recipient_document?: string | null;
  recipient_name?: string | null;
  billing_status?: BillingStatus;
  current_plan?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type BillingProfileListParams = {
  skip?: number;
  limit?: number;
};
