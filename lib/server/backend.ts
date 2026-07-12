import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:8000";
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function getBackendBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_BACKEND_URL
  ).replace(/\/$/, "");
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
  if (!origin) return true;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");
  const requestOrigin = host ? `${protocol}://${host}` : request.nextUrl.origin;
  const configuredOrigin = process.env.APP_ORIGIN?.replace(/\/$/, "");

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

export async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
