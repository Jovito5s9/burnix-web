export type ContractStatus = "draft" | "pending" | "active" | "expired" | "canceled";

export type Contract = {
  id: string;
  title: string;
  description: string;
  status: ContractStatus;
  price: number;
  created_at: string;
};

export type ContractListResponse = {
  items: Contract[];
  total: number;
};
