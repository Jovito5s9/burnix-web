/**
 * Utilitário legado de URLs de retorno.
 *
 * O fluxo atual do backend usa Pix/OpenPix e não depende dessas URLs para
 * confirmar pagamento. As páginas /sucesso, /falha e /pendente seguem
 * disponíveis apenas para compatibilidade com links externos/legados.
 *
 * A confirmação confiável deve vir do webhook OpenPix processado pelo backend
 * e depois ser consultada em /payments/, /payments/{payment_id} ou
 * /contracts/{contract_id}/payments.
 */
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
