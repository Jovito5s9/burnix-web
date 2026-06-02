export type ContractStatus = "draft" | "pending" | "active" | "expired" | "canceled";

export type Contract = {
  id: number;
  title: string;
  description: string;
  status: ContractStatus;

  price: string;

  client_id: number;
  owner_user_id: number;

  currency: string;

  start_date: string;
  end_date: string;

  created_at: string;
  updated_at: string;
};

export type ContractListResponse = {
  items: Contract[];
  total: number;
};
