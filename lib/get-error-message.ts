import axios from "axios";

type ValidationErrorItem = {
  field?: unknown;
  loc?: unknown;
  message?: unknown;
  msg?: unknown;
};

export type ApiErrorDetailObject = {
  code?: unknown;
  message?: unknown;
  errors?: ValidationErrorItem[];
  retryable?: unknown;
  [key: string]: unknown;
};

type ApiErrorDetail =
  | string
  | ValidationErrorItem[]
  | ApiErrorDetailObject
  | null
  | undefined;

export type ApiFieldErrors = Record<string, string>;

type ApiClientErrorOptions = {
  status?: number;
  fieldErrors?: ApiFieldErrors;
  code?: string;
  retryable?: boolean;
  detail?: ApiErrorDetailObject | null;
};

export class ApiClientError extends Error {
  status?: number;
  fieldErrors: ApiFieldErrors;
  code?: string;
  retryable?: boolean;
  detail: ApiErrorDetailObject | null;

  constructor(message: string, options: ApiClientErrorOptions = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? {};
    this.code = options.code;
    this.retryable = options.retryable;
    this.detail = options.detail ?? null;
  }
}

const FALLBACK_ERROR_MESSAGE =
  "Não foi possível concluir esta ação. Tente novamente em alguns instantes.";

const ERROR_CODE_MESSAGES: Record<string, string> = {
  event_not_found: "Evento não encontrado.",
  event_not_published: "Evento não encontrado.",
  event_registration_closed: "As inscrições para este evento estão encerradas.",
  event_capacity_reached: "As vagas deste evento já foram preenchidas.",
  registration_already_exists: "Você já possui uma inscrição neste evento.",
  registration_not_found: "Inscrição não encontrada.",
  registration_payment_not_allowed:
    "Não é possível gerar um novo pagamento para esta inscrição.",
  payment_already_confirmed: "Este pagamento já foi confirmado.",
  payment_provider_unavailable:
    "Não foi possível gerar o pagamento agora. Tente novamente em alguns instantes.",
  unsupported_payment_currency:
    "O pagamento por Pix não está disponível para a moeda deste evento.",
  invalid_registration_data: "Revise os dados da inscrição e tente novamente.",
  email_already_registered: "Este E-mail já está cadastrado.",
  participant_email_already_registered:
    "Este E-mail já está cadastrado para um participante.",
  invalid_credentials: "E-mail ou senha incorretos.",
  account_inactive: "Esta conta está inativa.",
  participant_authentication_required:
    "Entre com sua conta de participante para continuar.",
  authentication_required: "Entre na sua conta para continuar.",
  permission_denied: "Sua conta não possui permissão para realizar esta ação.",
  request_validation_error: "Revise os dados informados e tente novamente.",
  resource_not_found: "Não foi possível encontrar o conteúdo solicitado.",
  bad_request: "Não foi possível processar os dados informados.",
  conflict: "Não foi possível concluir a ação no estado atual.",
  internal_error:
    "Ocorreu um erro inesperado. Tente novamente em alguns instantes.",
  backend_unavailable:
    "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nome completo",
  email: "E-mail",
  phone: "Telefone",
  document: "Documento",
  sex: "Sexo",
  age: "Idade",
  password: "Senha",
  password_confirmation: "Confirmação de senha",
  title: "Título",
  description: "Descrição",
  price: "Preço",
  capacity: "Capacidade",
  start_date: "Início",
  end_date: "Fim",
  registration_deadline: "Prazo de inscrição",
};

function getCodeMessage(code: unknown) {
  return typeof code === "string" ? ERROR_CODE_MESSAGES[code] ?? null : null;
}

function looksTechnical(message: string) {
  return /(?:backend|endpoint|openpix|webhook|correlation|traceback|exception|stack trace|access[_ -]?token|bearer|responseType|sql|database|constraint|foreign key|http\s*\d{3}|\/api\/|\/(?:admin|contracts|clients|payments|participant)[/\w-]*)/i.test(
    message
  );
}

function sanitizeMessage(message: string | null | undefined) {
  const value = message?.trim();
  if (!value || looksTechnical(value)) return null;
  return value;
}

function stringifyLocation(location: unknown): string | null {
  if (typeof location === "string" && location.trim()) {
    return location;
  }

  if (Array.isArray(location)) {
    const value = location
      .filter((item) => typeof item === "string" || typeof item === "number")
      .map(String)
      .filter((item) => item !== "body" && item !== "extra_fields")
      .join(".");

    return value || null;
  }

  return null;
}

function getFieldLabel(field: string | null) {
  if (!field) return null;
  const lastSegment = field.split(".").at(-1) ?? field;
  return FIELD_LABELS[lastSegment] ?? "Campo";
}

function sanitizeValidationMessage(message: string | null) {
  if (!message) return null;

  const normalized = message.trim();
  if (!normalized) return null;

  if (/field required|required field|required$/i.test(normalized)) {
    return "Este campo é obrigatório.";
  }

  if (/email/i.test(normalized) && /invalid|valid/i.test(normalized)) {
    return "Informe um E-mail válido.";
  }

  if (/greater than|less than|at least|at most|too short|too long/i.test(normalized)) {
    return "O valor informado está fora do limite permitido.";
  }

  return sanitizeMessage(normalized) ?? "Valor inválido.";
}

function formatValidationItem(item: ValidationErrorItem): string | null {
  const rawMessage =
    typeof item.message === "string"
      ? item.message
      : typeof item.msg === "string"
        ? item.msg
        : null;
  const message = sanitizeValidationMessage(rawMessage);
  if (!message) return null;

  const field = stringifyLocation(item.field) ?? stringifyLocation(item.loc);
  const label = getFieldLabel(field);

  return label ? `${label}: ${message}` : message;
}

function formatDetail(detail: ApiErrorDetail): string | null {
  if (!detail) return null;

  if (typeof detail === "string") {
    return sanitizeMessage(detail);
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => formatValidationItem(item))
      .filter((message): message is string => Boolean(message));

    return messages.length > 0 ? messages.join(" ") : null;
  }

  if (typeof detail === "object") {
    const codeMessage = getCodeMessage(detail.code);
    const baseMessage =
      codeMessage ??
      sanitizeMessage(
        typeof detail.message === "string" ? detail.message : null
      );

    const errors = Array.isArray(detail.errors)
      ? detail.errors
          .map((item) => formatValidationItem(item))
          .filter((message): message is string => Boolean(message))
      : [];

    if (baseMessage && errors.length > 0) {
      return `${baseMessage} ${errors.join(" ")}`;
    }

    if (baseMessage) return baseMessage;
    if (errors.length > 0) return errors.join(" ");
  }

  return null;
}

function getValidationItemField(item: ValidationErrorItem): string | null {
  return stringifyLocation(item.field) ?? stringifyLocation(item.loc);
}

function getValidationItemMessage(item: ValidationErrorItem): string | null {
  const rawMessage =
    typeof item.message === "string"
      ? item.message
      : typeof item.msg === "string"
        ? item.msg
        : null;

  return sanitizeValidationMessage(rawMessage);
}

function collectFieldErrors(detail: ApiErrorDetail): ApiFieldErrors {
  const fieldErrors: ApiFieldErrors = {};
  const items = Array.isArray(detail)
    ? detail
    : detail && typeof detail === "object" && Array.isArray(detail.errors)
      ? detail.errors
      : [];

  for (const item of items) {
    const field = getValidationItemField(item);
    const message = getValidationItemMessage(item);

    if (field && message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

function asDetailObject(detail: unknown): ApiErrorDetailObject | null {
  return detail && typeof detail === "object" && !Array.isArray(detail)
    ? (detail as ApiErrorDetailObject)
    : null;
}

function getAxiosErrorDetail(error: unknown): ApiErrorDetail {
  if (!axios.isAxiosError(error)) return null;

  const data = error.response?.data as
    | { detail?: ApiErrorDetail; message?: unknown }
    | undefined;

  return data?.detail;
}

export function getApiErrorDetail(error: unknown): ApiErrorDetailObject | null {
  if (error instanceof ApiClientError) return error.detail;
  return asDetailObject(getAxiosErrorDetail(error));
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiClientError) return error.code;

  const detail = getApiErrorDetail(error);
  return typeof detail?.code === "string" ? detail.code : undefined;
}

export function getApiErrorRetryable(error: unknown): boolean | undefined {
  if (error instanceof ApiClientError) return error.retryable;

  const detail = getApiErrorDetail(error);
  return typeof detail?.retryable === "boolean" ? detail.retryable : undefined;
}

export function isApiNetworkError(error: unknown): boolean {
  if (error instanceof ApiClientError) return error.status === undefined;
  return axios.isAxiosError(error) && !error.response;
}

export function getApiFieldErrors(error: unknown): ApiFieldErrors {
  if (error instanceof ApiClientError) return error.fieldErrors;
  return collectFieldErrors(getAxiosErrorDetail(error));
}

export function getErrorMessage(
  error: unknown,
  fallback = FALLBACK_ERROR_MESSAGE
): string {
  const codeMessage = getCodeMessage(getApiErrorCode(error));
  if (codeMessage) return codeMessage;

  if (error instanceof ApiClientError) {
    return sanitizeMessage(error.message) ?? fallback;
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.";
    }

    const data = error.response.data as
      | { detail?: ApiErrorDetail; message?: unknown }
      | undefined;

    const detailMessage = formatDetail(data?.detail);
    if (detailMessage) return detailMessage;

    const responseMessage =
      typeof data?.message === "string" ? sanitizeMessage(data.message) : null;

    return responseMessage ?? fallback;
  }

  return fallback;
}
