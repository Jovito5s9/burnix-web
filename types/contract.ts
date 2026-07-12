export type ContractStatus = "draft" | "published" | "closed" | "cancelled";

export type Contract = {
  id: number;
  owner_user_id: number;
  client_id: number | null;

  title: string;
  description: string | null;
  status: ContractStatus;
  version: number;

  price: string;
  currency: "BRL";

  capacity: number | null;

  /** Campos legados mantidos pelo backend durante a transição temporal. */
  start_date: string | null;
  end_date: string | null;

  /** Fonte temporal precisa do evento. */
  start_at: string | null;
  end_at: string | null;
  timezone: string;
  registration_deadline: string | null;

  payment_config: Record<string, unknown> | null;

  published_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractCreatePayload = {
  title: string;
  description?: string | null;
  status?: Extract<ContractStatus, "draft" | "published">;
  price?: string;
  currency?: "BRL";
  capacity?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  timezone?: string;
  registration_deadline?: string | null;
  payment_config?: Record<string, unknown> | null;
};

export type ContractUpdatePayload = {
  version: number;
  client_id?: number | null;
  title?: string;
  description?: string | null;
  price?: string;
  currency?: "BRL";
  capacity?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  timezone?: string;
  registration_deadline?: string | null;
  payment_config?: Record<string, unknown> | null;
};

export type ContractActionPayload = {
  version: number;
};

export type ContractStatusAction = "publish" | "close" | "cancel" | "reopen";

export type ContractListParams = {
  skip?: number;
  limit?: number;
};

export type ContractListResponse = {
  items: Contract[];
  total: number;
  skip: number;
  limit: number;
};
