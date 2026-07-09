import { api } from "@/services/api";
import type {
  CreateContractCheckoutPayload,
  CreateContractPixPayload,
  CreateRegistrationPixPayload,
  Payment,
  PaymentListParams,
  PaymentPixResponse,
} from "@/types/payment";

function normalizePaymentPixResponse(data: unknown): PaymentPixResponse {
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const payment = record.payment as Payment | undefined;

  if (!payment) {
    throw new Error("O backend não retornou o objeto payment.");
  }

  return {
    payment,
    checkout_url: typeof record.checkout_url === "string" ? record.checkout_url : null,
    qr_code: typeof record.qr_code === "string" ? record.qr_code : null,
    qr_code_base64:
      typeof record.qr_code_base64 === "string" ? record.qr_code_base64 : null,
    copy_and_paste:
      typeof record.copy_and_paste === "string" ? record.copy_and_paste : null,
  };
}

export async function listPayments(params?: PaymentListParams) {
  const { data } = await api.get<Payment[]>("/payments/", { params });
  return data;
}

export async function getPayment(id: string | number) {
  const { data } = await api.get<Payment>(`/payments/${id}`);
  return data;
}

export async function createContractPixPayment(payload: CreateContractPixPayload) {
  const { contract_id, ...body } = payload;
  const { data } = await api.post<unknown>(
    `/payments/contracts/${contract_id}/pix`,
    body
  );

  return normalizePaymentPixResponse(data);
}

export async function createContractCheckoutPayment(
  payload: CreateContractCheckoutPayload
) {
  const { contract_id, ...body } = payload;
  const { data } = await api.post<unknown>(
    `/payments/contracts/${contract_id}/checkout`,
    body
  );

  return normalizePaymentPixResponse(data);
}

export async function createRegistrationPixPayment(
  clientId: string | number,
  payload: CreateRegistrationPixPayload = {}
) {
  const { data } = await api.post<unknown>(
    `/payments/registrations/${clientId}/pix`,
    payload
  );

  return normalizePaymentPixResponse(data);
}
