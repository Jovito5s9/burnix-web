import axios from "axios";

type ValidationErrorItem = {
  field?: unknown;
  loc?: unknown;
  message?: unknown;
  msg?: unknown;
};

type ApiErrorDetail =
  | string
  | ValidationErrorItem[]
  | {
      message?: unknown;
      errors?: ValidationErrorItem[];
    }
  | Record<string, unknown>
  | null
  | undefined;

export type ApiFieldErrors = Record<string, string>;

export class ApiClientError extends Error {
  status?: number;
  fieldErrors: ApiFieldErrors;

  constructor(message: string, status?: number, fieldErrors: ApiFieldErrors = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fieldErrors = fieldErrors;
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

export function getApiFieldErrors(error: unknown): ApiFieldErrors {
  if (error instanceof ApiClientError) {
    return error.fieldErrors;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: ApiErrorDetail; message?: unknown }
      | undefined;

    return collectFieldErrors(data?.detail);
  }

  return {};
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

    if (error.message) {
      return error.message;
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
