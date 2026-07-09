import { createContractCheckoutPayment } from "@/services/payments";
import type { CheckoutResponse, CreateCheckoutPayload } from "@/types/checkout";

export async function createCheckout(
  payload: CreateCheckoutPayload
): Promise<CheckoutResponse> {
  const result = await createContractCheckoutPayment(payload);
  const paymentId = String(result.payment.id);
  const checkoutUrl = result.checkout_url ?? "";

  return {
    ...result,
    id: paymentId,
    checkoutUrl,
    checkout_url: result.checkout_url,
    paymentId,
    payment_id: paymentId,
    status: result.payment.status,
  };
}
