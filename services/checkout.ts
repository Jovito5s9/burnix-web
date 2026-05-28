import { api } from "@/services/api";
import type {
  CheckoutResponse,
  CreateCheckoutPayload,
} from "@/types/checkout";

function normalizeCheckoutResponse(
  data: unknown
): CheckoutResponse {
  if (!data || typeof data !== "object") {
    return {
      checkoutUrl: "",
    };
  }

  const record = data as Record<string, unknown>;

  // =========================================================
  // BACKEND RESPONSE
  // =========================================================
  // PaymentCreateResponse:
  //
  // {
  //   payment: {...},
  //   checkout_url: "..."
  // }
  // =========================================================

  const payment =
    typeof record.payment === "object" &&
    record.payment !== null
      ? (record.payment as Record<string, unknown>)
      : null;

  const checkoutUrl =
    (typeof record.checkoutUrl === "string" &&
      record.checkoutUrl) ||
    (typeof record.checkout_url === "string" &&
      record.checkout_url) ||
    (typeof record.url === "string" &&
      record.url) ||
    (typeof record.redirectUrl === "string" &&
      record.redirectUrl) ||
    (typeof record.redirect_url === "string" &&
      record.redirect_url) ||
    "";

  const id =
    (typeof record.id === "string" &&
      record.id) ||
    (typeof record.checkoutId === "string" &&
      record.checkoutId) ||
    (typeof record.checkout_id === "string" &&
      record.checkout_id) ||
    (payment &&
      typeof payment.id === "number"
      ? String(payment.id)
      : undefined);

  const paymentId =
    (typeof record.paymentId === "string" &&
      record.paymentId) ||
    (typeof record.payment_id === "string" &&
      record.payment_id) ||
    (payment &&
      typeof payment.id === "number"
      ? String(payment.id)
      : undefined);

  const status =
    (typeof record.status === "string" &&
      record.status) ||
    (payment &&
    typeof payment.status === "string"
      ? payment.status
      : undefined);

  return {
    ...(id ? { id } : {}),
    checkoutUrl,
    ...(checkoutUrl
      ? { checkout_url: checkoutUrl }
      : {}),
    ...(paymentId
      ? {
          paymentId,
          payment_id: paymentId,
        }
      : {}),
    ...(status ? { status } : {}),
  };
}

export async function createCheckout(
  payload: CreateCheckoutPayload
): Promise<CheckoutResponse> {
  const {
    contract_id,
    payer_email,
    payer_name,
  } = payload;

  const body = {
    payer_email,
    payer_name,
  };

  const { data } = await api.post<unknown>(
    `/payments/contracts/${contract_id}/checkout`,
    body
  );

  return normalizeCheckoutResponse(data);
}