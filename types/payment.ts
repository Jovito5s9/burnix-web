export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Payment = {
  id: string;
  contractId: string;
  amount: number;
  status: PaymentStatus;
  method?: "pix" | "card" | "boleto";
  createdAt: string;
};

export type PaymentListResponse = {
  items: Payment[];
  total: number;
};
