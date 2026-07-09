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

const FALLBACK_ERROR_MESSAGE = "Erro inesperado.";

function stringifyLocation(location: unknown): string | null {
  if (typeof location === "string" && location.trim()) {
    return location;
  }

  if (Array.isArray(location)) {
    const value = location
      .filter((item) => typeof item === "string" || typeof item === "number")
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

export function getErrorMessage(
  error: unknown,
  fallback = FALLBACK_ERROR_MESSAGE
): string {
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
