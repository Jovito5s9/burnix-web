import { api } from "@/services/api";
import type { CheckoutResponse, CreateCheckoutPayload } from "@/types/checkout";

const checkoutPath = process.env.NEXT_PUBLIC_CHECKOUT_PATH ?? "/checkout";

function normalizeCheckoutResponse(data: unknown): CheckoutResponse {
  if (!data || typeof data !== "object") {
    return { checkoutUrl: "" };
  }

  const record = data as Record<string, unknown>;
  const checkoutUrl =
    (typeof record.checkoutUrl === "string" && record.checkoutUrl) ||
    (typeof record.checkout_url === "string" && record.checkout_url) ||
    (typeof record.url === "string" && record.url) ||
    (typeof record.redirectUrl === "string" && record.redirectUrl) ||
    (typeof record.redirect_url === "string" && record.redirect_url) ||
    "";

  const id =
    (typeof record.id === "string" && record.id) ||
    (typeof record.checkoutId === "string" && record.checkoutId) ||
    (typeof record.checkout_id === "string" && record.checkout_id);

  const paymentId =
    (typeof record.paymentId === "string" && record.paymentId) ||
    (typeof record.payment_id === "string" && record.payment_id);

  const status = typeof record.status === "string" ? record.status : undefined;

  return {
    ...(id ? { id } : {}),
    checkoutUrl,
    ...(checkoutUrl ? { checkout_url: checkoutUrl } : {}),
    ...(paymentId ? { paymentId, payment_id: paymentId } : {}),
    ...(status ? { status } : {}),
  };
}

export async function createCheckout(payload: CreateCheckoutPayload) {
  const { data } = await api.post<unknown>(checkoutPath, payload);
  return normalizeCheckoutResponse(data);
}
