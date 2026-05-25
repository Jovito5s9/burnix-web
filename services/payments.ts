import { api } from "@/services/api";
import type { Payment, PaymentListResponse } from "@/types/payment";

export async function listPayments() {
  const { data } = await api.get<PaymentListResponse>("/payments");
  return data;
}

export async function getPayment(id: string) {
  const { data } = await api.get<Payment>(`/payments/${id}`);
  return data;
}
