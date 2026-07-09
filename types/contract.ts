export type ContractStatus = "draft" | "published" | "closed" | "cancelled";

export type Contract = {
  id: number;
  owner_user_id: number;
  client_id: number | null;

  title: string;
  description: string | null;
  status: ContractStatus;

  price: string;
  currency: string;

  capacity: number | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;

  payment_config: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
};

export type ContractCreatePayload = {
  title: string;
  description?: string | null;
  status?: ContractStatus;
  price?: string;
  currency?: string;
  capacity?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  registration_deadline?: string | null;
  payment_config?: Record<string, unknown> | null;
};

export type ContractUpdatePayload = Partial<ContractCreatePayload> & {
  client_id?: number | null;
};

export type ContractListParams = {
  skip?: number;
  limit?: number;
};

export type ContractListResponse = {
  items: Contract[];
  total: number;
};
