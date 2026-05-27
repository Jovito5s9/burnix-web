export type CreateCheckoutPayload = {
  contract_id: number;
  amount?: number;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
};

export type CheckoutResponse = {
  id?: string;
  checkoutUrl: string;
  checkout_url?: string;
  paymentId?: string;
  payment_id?: string;
  status?: string;
};
