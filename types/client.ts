import type {
  RegistrationPaymentStatus,
  RegistrationStatus,
} from "@/types/registration";

export type Client = {
  id: number;
  owner_user_id: number;
  contract_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  sex: string | null;
  age: number | null;
  extra_fields: Record<string, unknown> | null;
  registration_status: RegistrationStatus;
  payment_status: RegistrationPaymentStatus;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientCreatePayload = {
  contract_id?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  sex?: string | null;
  age?: number | null;
  extra_fields?: Record<string, unknown> | null;
  registration_status?: RegistrationStatus;
  payment_status?: RegistrationPaymentStatus;
  notes?: string | null;
  is_active?: boolean;
};

export type ClientUpdatePayload = Partial<ClientCreatePayload>;

export type ClientListParams = {
  skip?: number;
  limit?: number;
};
