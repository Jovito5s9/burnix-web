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

const FALLBACK_ERROR_MESSAGE = "Erro inesperado.";

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

function formatValidationItem(item: ValidationErrorItem): string | null {
  const message =
    typeof item.message === "string"
      ? item.message
      : typeof item.msg === "string"
        ? item.msg
        : null;

  if (!message) return null;

  const field = stringifyLocation(item.field) ?? stringifyLocation(item.loc);

  return field ? `${field}: ${message}` : message;
}

function formatDetail(detail: ApiErrorDetail): string | null {
  if (!detail) return null;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => formatValidationItem(item))
      .filter((message): message is string => Boolean(message));

    return messages.length > 0 ? messages.join("; ") : null;
  }

  if (typeof detail === "object") {
    const baseMessage =
      typeof detail.message === "string" ? detail.message : null;

    const errors = Array.isArray(detail.errors)
      ? detail.errors
          .map((item) => formatValidationItem(item))
          .filter((message): message is string => Boolean(message))
      : [];

    if (baseMessage && errors.length > 0) {
      return `${baseMessage}: ${errors.join("; ")}`;
    }

    if (baseMessage) {
      return baseMessage;
    }

    if (errors.length > 0) {
      return errors.join("; ");
    }
  }

  return null;
}

function getValidationItemField(item: ValidationErrorItem): string | null {
  return stringifyLocation(item.field) ?? stringifyLocation(item.loc);
}

function getValidationItemMessage(item: ValidationErrorItem): string | null {
  return typeof item.message === "string"
    ? item.message
    : typeof item.msg === "string"
      ? item.msg
      : null;
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
  if (error instanceof ApiClientError) {
    return error.detail;
  }

  return asDetailObject(getAxiosErrorDetail(error));
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiClientError) {
    return error.code;
  }

  const detail = getApiErrorDetail(error);
  return typeof detail?.code === "string" ? detail.code : undefined;
}

export function getApiErrorRetryable(error: unknown): boolean | undefined {
  if (error instanceof ApiClientError) {
    return error.retryable;
  }

  const detail = getApiErrorDetail(error);
  return typeof detail?.retryable === "boolean" ? detail.retryable : undefined;
}

export function isApiNetworkError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === undefined;
  }

  return axios.isAxiosError(error) && !error.response;
}

export function getApiFieldErrors(error: unknown): ApiFieldErrors {
  if (error instanceof ApiClientError) {
    return error.fieldErrors;
  }

  return collectFieldErrors(getAxiosErrorDetail(error));
}

export function getErrorMessage(
  error: unknown,
  fallback = FALLBACK_ERROR_MESSAGE
): string {
  if (error instanceof ApiClientError && error.message) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: ApiErrorDetail; message?: unknown }
      | undefined;

    const detailMessage = formatDetail(data?.detail);

    if (detailMessage) {
      return detailMessage;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
