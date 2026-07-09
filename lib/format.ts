import type { ContractStatus } from "@/types/contract";
import type { PaymentStatus } from "@/types/payment";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatCurrency(value: number, currency = "BRL") {
  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  });

  return formatter.format(value);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFormatter.format(date);
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR").format(value);
}

export function getContractStatusLabel(status: ContractStatus) {
  const labels: Record<ContractStatus, string> = {
    draft: "Rascunho",
    published: "Publicado",
    closed: "Encerrado",
    cancelled: "Cancelado",
  };

  return labels[status];
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pendente",
    paid: "Pago",
    failed: "Falhou",
    expired: "Expirado",
    error: "Erro",
    refunded: "Estornado",
  };

  return labels[status];
}

export function getReadableMethod(method?: string | null) {
  const methods: Record<string, string> = {
    pix: "PIX",
    card: "Cartão",
    boleto: "Boleto",
  };

  if (!method) return "—";
  return methods[method] ?? method;
}
