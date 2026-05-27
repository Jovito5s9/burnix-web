export type ContractStatus = "draft" | "pending" | "active" | "expired" | "canceled";

export type Contract = {
  id: string;
  customer_name: string;
  plan_name: string;
  status: ContractStatus;
  amount: number;
  created_at: string;
};

export type ContractListResponse = {
  items: Contract[];
  total: number;
};
