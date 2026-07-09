import { api } from "@/services/api";
import type { Payment, PaymentCreatePayload } from "@/types/payment";

export async function listPayments() {
  const { data } = await api.get<Payment[]>("/payments/");
  return data;
}

export async function getPayment(id: string) {
  const { data } = await api.get<Payment>(`/payments/${id}`);
  return data;
}

export async function createPayment(payload: PaymentCreatePayload) {
  const { data } = await api.post<Payment>("/payments/", payload);
  return data;
}
