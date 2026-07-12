import type { ContractStatus } from "@/types/contract";
import type { PaymentStatus } from "@/types/payment";
import type {
  ParticipantRegistrationPaymentStatus,
  ParticipantRegistrationStatus,
} from "@/types/participant-registration";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const eventDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function formatEventDate(value?: string | null) {
  if (!value) return "Data a definir";

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnlyMatch
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "Data a definir";

  return eventDateFormatter.format(date);
}

export function formatEventDateRange(
  startDate?: string | null,
  endDate?: string | null
) {
  if (!startDate && !endDate) return "Data a definir";
  if (!startDate) return `Até ${formatEventDate(endDate)}`;
  if (!endDate || startDate === endDate) return formatEventDate(startDate);

  return `${formatEventDate(startDate)} a ${formatEventDate(endDate)}`;
}

export function formatCurrency(value: number, currency = "BRL") {
  if (!Number.isFinite(value)) return "—";

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return dateFormatter.format(date);
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
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

  return labels[status] ?? "Status indisponível";
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    pending: "Aguardando pagamento",
    paid: "Pago",
    expired: "Expirado",
    error: "Não concluído",
    refunded: "Estornado",
  };

  return labels[status] ?? "Status indisponível";
}

export function getReadableMethod(method?: string | null) {
  const methods: Record<string, string> = {
    pix: "Pix",
    card: "Cartão",
    boleto: "Boleto",
  };

  if (!method) return "—";
  return methods[method.toLowerCase()] ?? "Outro meio de pagamento";
}

export function getParticipantRegistrationStatusLabel(
  status: ParticipantRegistrationStatus
) {
  const labels: Record<ParticipantRegistrationStatus, string> = {
    pending_payment: "Aguardando pagamento",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    expired: "Expirada",
  };

  return labels[status] ?? "Status indisponível";
}

export function getParticipantPaymentStatusLabel(
  status: ParticipantRegistrationPaymentStatus
) {
  const labels: Record<ParticipantRegistrationPaymentStatus, string> = {
    pending: "Aguardando pagamento",
    paid: "Pagamento confirmado",
    expired: "Pix expirado",
    error: "Pagamento não concluído",
    refunded: "Pagamento estornado",
    not_required: "Evento gratuito",
  };

  return labels[status] ?? "Status indisponível";
}
