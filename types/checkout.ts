import type {
  CreateContractCheckoutPayload,
  Payment,
  PaymentPixResponse,
} from "@/types/payment";

export type CreateCheckoutPayload = CreateContractCheckoutPayload;

export type CheckoutResponse = PaymentPixResponse & {
  id?: string;
  checkoutUrl: string;
  checkout_url: string | null;
  paymentId?: string;
  payment_id?: string;
  status?: string;
  payment: Payment;
};
