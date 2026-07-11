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

  if (Number.isNaN(date.getTime())) return value;

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


export function getParticipantRegistrationStatusLabel(
  status: ParticipantRegistrationStatus
) {
  const labels: Record<ParticipantRegistrationStatus, string> = {
    pending_payment: "Aguardando pagamento",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    expired: "Expirada",
  };

  return labels[status];
}

export function getParticipantPaymentStatusLabel(
  status: ParticipantRegistrationPaymentStatus
) {
  const labels: Record<ParticipantRegistrationPaymentStatus, string> = {
    pending: "Pendente",
    paid: "Pago",
    expired: "Expirado",
    error: "Falha ao gerar",
    refunded: "Estornado",
    not_required: "Não necessário",
  };

  return labels[status];
}
