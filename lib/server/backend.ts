import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEVELOPMENT_BACKEND_URL = "http://localhost:8000";
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const DEFAULT_BODY_LIMITS = {
  auth: 16_384,
  registration: 262_144,
  formField: 65_536,
  mutation: 1_048_576,
} as const;

export class RequestBodyTooLargeError extends Error {
  constructor(
    public readonly maxBytes: number,
    public readonly receivedBytes?: number
  ) {
    super("Request body exceeds the configured limit.");
    this.name = "RequestBodyTooLargeError";
  }
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function normalizeHttpUrl(name: string, value: string) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} deve ser uma URL HTTP(S) absoluta.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${name} deve usar o protocolo http:// ou https://.`);
  }

  return parsed.toString().replace(/\/+$/, "");
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const parsed = Number(rawValue);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um número inteiro positivo.`);
  }

  return parsed;
}

export function getBackendBaseUrl() {
  const configuredUrl = process.env.API_URL?.trim();

  if (!configuredUrl) {
    if (isProduction()) {
      throw new Error(
        "API_URL é obrigatória em produção e deve apontar para o backend privado."
      );
    }

    return DEVELOPMENT_BACKEND_URL;
  }

  return normalizeHttpUrl("API_URL", configuredUrl);
}

export function getConfiguredAppOrigin() {
  const configuredOrigin = process.env.APP_ORIGIN?.trim();

  if (!configuredOrigin) {
    if (isProduction()) {
      throw new Error(
        "APP_ORIGIN é obrigatória em produção e deve conter a origem pública canônica."
      );
    }

    return null;
  }

  return new URL(normalizeHttpUrl("APP_ORIGIN", configuredOrigin)).origin;
}

export function buildBackendUrl(pathname: string, search = "") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getBackendBaseUrl()}${normalizedPath}${search}`;
}

export function getOrCreateRequestId(request: NextRequest) {
  const incoming = request.headers.get("x-request-id")?.trim();
  return incoming && REQUEST_ID_PATTERN.test(incoming)
    ? incoming
    : crypto.randomUUID();
}

export function isTrustedRequestOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!origin) {
    return fetchSite !== "cross-site";
  }

  const configuredOrigin = getConfiguredAppOrigin();
  if (isProduction()) {
    return origin === configuredOrigin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");
  const requestOrigin = host ? `${protocol}://${host}` : request.nextUrl.origin;

  return (
    origin === request.nextUrl.origin ||
    origin === requestOrigin ||
    Boolean(configuredOrigin && origin === configuredOrigin)
  );
}

function jsonErrorResponse(
  status: number,
  code: string,
  message: string,
  requestId?: string
) {
  const response = NextResponse.json(
    { detail: { code, message } },
    { status }
  );
  response.headers.set("cache-control", "no-store");
  if (requestId) response.headers.set("x-request-id", requestId);
  return response;
}

export function invalidOriginResponse(requestId?: string) {
  return jsonErrorResponse(
    403,
    "invalid_request_origin",
    "A origem da requisição não é permitida.",
    requestId
  );
}

export function invalidPayloadResponse(requestId?: string) {
  return jsonErrorResponse(
    422,
    "request_validation_error",
    "Os dados enviados são inválidos.",
    requestId
  );
}

export function requestBodyTooLargeResponse(requestId?: string) {
  return jsonErrorResponse(
    413,
    "request_body_too_large",
    "Os dados enviados excedem o tamanho permitido.",
    requestId
  );
}

export function backendUnavailableResponse(requestId?: string) {
  return jsonErrorResponse(
    503,
    "backend_unavailable",
    "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
    requestId
  );
}

export function unexpectedBackendRedirectResponse(requestId: string) {
  return jsonErrorResponse(
    502,
    "unexpected_backend_redirect",
    "O serviço respondeu com um redirecionamento inesperado.",
    requestId
  );
}

export function isRedirectStatus(status: number) {
  return status >= 300 && status < 400;
}

export function copyBackendResponseHeaders(
  source: Headers,
  fallbackRequestId?: string
) {
  const headers = new Headers();

  for (const name of [
    "content-type",
    "content-disposition",
    "etag",
    "last-modified",
    "retry-after",
    "x-request-id",
  ]) {
    const value = source.get(name);
    if (value) headers.set(name, value);
  }

  if (!headers.has("x-request-id") && fallbackRequestId) {
    headers.set("x-request-id", fallbackRequestId);
  }

  headers.set("cache-control", "no-store");
  return headers;
}

export function getAuthRequestBodyLimit() {
  return getPositiveIntegerEnv(
    "BFF_AUTH_REQUEST_MAX_BODY_BYTES",
    DEFAULT_BODY_LIMITS.auth
  );
}

export function getProxyRequestBodyLimit(pathname: string, method: string) {
  if (method === "GET" || method === "HEAD") return 0;

  if (pathname === "/auth/register") {
    return getAuthRequestBodyLimit();
  }

  if (
    method === "POST" &&
    /^\/participant\/contracts\/\d+\/registrations$/.test(pathname)
  ) {
    return getPositiveIntegerEnv(
      "BFF_REGISTRATION_REQUEST_MAX_BODY_BYTES",
      DEFAULT_BODY_LIMITS.registration
    );
  }

  if (pathname.includes("/form-fields")) {
    return getPositiveIntegerEnv(
      "BFF_FORM_FIELD_REQUEST_MAX_BODY_BYTES",
      DEFAULT_BODY_LIMITS.formField
    );
  }

  return getPositiveIntegerEnv(
    "BFF_REQUEST_BODY_DEFAULT_MAX_BYTES",
    DEFAULT_BODY_LIMITS.mutation
  );
}

function getDeclaredContentLength(request: NextRequest) {
  const rawValue = request.headers.get("content-length");
  if (!rawValue) return null;

  const parsed = Number(rawValue);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function readRequestBody(
  request: NextRequest,
  maxBytes: number
): Promise<ArrayBuffer | undefined> {
  if (!request.body) return undefined;

  const declaredLength = getDeclaredContentLength(request);
  if (declaredLength !== null && declaredLength > maxBytes) {
    throw new RequestBodyTooLargeError(maxBytes, declaredLength);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError(maxBytes, totalBytes);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) return undefined;

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body.buffer;
}

export async function readJsonBody(
  request: NextRequest,
  maxBytes = getAuthRequestBodyLimit()
) {
  const body = await readRequestBody(request, maxBytes);
  if (!body) return null;

  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    return null;
  }
}
