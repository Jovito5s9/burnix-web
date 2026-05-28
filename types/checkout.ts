export type CreateCheckoutPayload = {
  contract_id: number;
  payer_email: string;
  payer_name: string;
};

export type CheckoutResponse = {
  id?: string;
  checkoutUrl: string;
  checkout_url?: string;
  paymentId?: string;
  payment_id?: string;
  status?: string;
};
