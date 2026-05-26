import type { ContractStatus } from "@/types/contract";
import type { PaymentStatus } from "@/types/payment";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFormatter.format(date);
}

export function getContractStatusLabel(status: ContractStatus) {
  const labels: Record<ContractStatus, string> = {
    draft: "Rascunho",
    pending: "Pendente",
    active: "Ativo",
    expired: "Expirado",
    canceled: "Cancelado",
  };

  return labels[status];
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pendente",
    paid: "Pago",
    failed: "Falhou",
    refunded: "Estornado",
  };

  return labels[status];
}

export function getReadableMethod(method?: string) {
  const methods: Record<string, string> = {
    pix: "PIX",
    card: "Cartão",
    boleto: "Boleto",
  };

  if (!method) return "—";
  return methods[method] ?? method;
}
