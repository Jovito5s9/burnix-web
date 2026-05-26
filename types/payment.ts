export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "pix" | "card" | "boleto";

export type Payment = {
  id: string;
  contractId: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  createdAt: string;
};

export type PaymentListResponse = {
  items: Payment[];
  total: number;
};

export type PaymentCreatePayload = {
  contractId: string;
  amount: number;
  method: PaymentMethod;
};
