export type ContractStatus = "draft" | "pending" | "active" | "expired" | "canceled";

export type Contract = {
  id: string;
  customerName: string;
  planName: string;
  status: ContractStatus;
  amount: number;
  createdAt: string;
};

export type ContractListResponse = {
  items: Contract[];
  total: number;
};
