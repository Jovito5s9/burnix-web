import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:8000";

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

export function invalidOriginResponse() {
  return NextResponse.json(
    {
      detail: {
        code: "invalid_request_origin",
        message: "A origem da requisição não é permitida.",
      },
    },
    { status: 403 }
  );
}

export function invalidPayloadResponse() {
  return NextResponse.json(
    {
      detail: {
        code: "request_validation_error",
        message: "Os dados enviados são inválidos.",
      },
    },
    { status: 422 }
  );
}

export function backendUnavailableResponse() {
  return NextResponse.json(
    {
      detail: {
        code: "backend_unavailable",
        message: "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
      },
    },
    { status: 503 }
  );
}

export function copyBackendResponseHeaders(source: Headers) {
  const headers = new Headers();

  for (const name of [
    "content-type",
    "content-disposition",
    "etag",
    "last-modified",
  ]) {
    const value = source.get(name);
    if (value) headers.set(name, value);
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
