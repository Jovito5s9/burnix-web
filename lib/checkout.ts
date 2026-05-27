export type CheckoutReturnUrls = {
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
};

export function buildCheckoutReturnUrls(origin: string): CheckoutReturnUrls {
  const normalizedOrigin = origin.replace(/\/$/, "");

  return {
    successUrl: `${normalizedOrigin}/sucesso`,
    failureUrl: `${normalizedOrigin}/falha`,
    pendingUrl: `${normalizedOrigin}/pendente`,
  };
}
