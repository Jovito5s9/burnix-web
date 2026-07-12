import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  backendUnavailableResponse,
  buildBackendUrl,
  copyBackendResponseHeaders,
  getOrCreateRequestId,
  getProxyRequestBodyLimit,
  invalidOriginResponse,
  invalidPayloadResponse,
  isRedirectStatus,
  isTrustedRequestOrigin,
  readRequestBody,
  RequestBodyTooLargeError,
  requestBodyTooLargeResponse,
  unexpectedBackendRedirectResponse,
} from "@/lib/server/backend";
import {
  clearSessionCookie,
  getSessionCookieName,
  type BackendSession,
} from "@/lib/server/session";

type RouteContext = {
  params: Promise<{
    session: string;
    path: string[];
  }>;
};

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isBackendSession(value: string): value is BackendSession {
  return value === "organizer" || value === "participant" || value === "public";
}

function isAllowedPath(session: BackendSession, pathname: string, method: string) {
  if (session === "public") {
    return method === "GET" && /^\/public\/contracts\/[^/]+$/.test(pathname);
  }

  if (session === "participant") {
    if (pathname === "/participant-auth/me") return method === "GET";

    if (/^\/participant\/registrations(?:\/\d+)?$/.test(pathname)) {
      return method === "GET";
    }

    if (/^\/participant\/contracts\/\d+\/registrations$/.test(pathname)) {
      return method === "POST";
    }

    if (/^\/participant\/registrations\/\d+\/payments\/pix$/.test(pathname)) {
      return method === "POST";
    }

    return false;
  }

  if (pathname === "/auth/register") return method === "POST";
  if (pathname === "/auth/me") return method === "GET";

  const organizerPrefixes = [
    "/contracts",
    "/clients",
    "/payments",
    "/billing-profiles",
    "/integrations",
    "/admin",
  ];

  if (pathname === "/payments/webhook/openpix") return false;

  return organizerPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function buildRequestHeaders(
  request: NextRequest,
  token: string | null,
  requestId: string
) {
  const headers = new Headers();

  for (const name of ["accept", "accept-language", "content-type", "if-none-match"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set("x-request-id", requestId);
  if (token) headers.set("authorization", `Bearer ${token}`);
  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const requestId = getOrCreateRequestId(request);
  const startedAt = performance.now();

  if (unsafeMethods.has(request.method) && !isTrustedRequestOrigin(request)) {
    return invalidOriginResponse(requestId);
  }

  const { session: rawSession, path } = await context.params;

  if (!isBackendSession(rawSession)) {
    const response = NextResponse.json(
      {
        detail: {
          code: "resource_not_found",
          message: "Recurso não encontrado.",
        },
      },
      { status: 404 }
    );
    response.headers.set("x-request-id", requestId);
    response.headers.set("cache-control", "no-store");
    return response;
  }

  const pathname = `/${path.map(encodeURIComponent).join("/")}`;

  if (!isAllowedPath(rawSession, pathname, request.method)) {
    const response = NextResponse.json(
      {
        detail: {
          code: "permission_denied",
          message: "Esta operação não é permitida.",
        },
      },
      { status: 403 }
    );
    response.headers.set("x-request-id", requestId);
    response.headers.set("cache-control", "no-store");
    return response;
  }

  const cookieName =
    rawSession === "public" ? null : getSessionCookieName(rawSession);
  const token = cookieName ? request.cookies.get(cookieName)?.value ?? null : null;
  let requestBody: ArrayBuffer | undefined;
  try {
    const bodyLimit = getProxyRequestBodyLimit(pathname, request.method);
    requestBody =
      bodyLimit > 0 ? await readRequestBody(request, bodyLimit) : undefined;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return requestBodyTooLargeResponse(requestId);
    }

    console.error("Falha ao ler o corpo encaminhado pelo BFF.", {
      request_id: requestId,
      session: rawSession,
      method: request.method,
      pathname,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return invalidPayloadResponse(requestId);
  }

  try {
    const backendResponse = await fetch(
      buildBackendUrl(pathname, request.nextUrl.search),
      {
        method: request.method,
        headers: buildRequestHeaders(request, token, requestId),
        body: requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
        cache: "no-store",
        redirect: "manual",
      }
    );

    const backendRequestId =
      backendResponse.headers.get("x-request-id") ?? requestId;

    if (isRedirectStatus(backendResponse.status)) {
      console.error("BFF recebeu redirecionamento inesperado do backend.", {
        request_id: backendRequestId,
        session: rawSession,
        method: request.method,
        pathname,
        status: backendResponse.status,
        location: backendResponse.headers.get("location"),
      });
      return unexpectedBackendRedirectResponse(backendRequestId);
    }

    const response = new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: copyBackendResponseHeaders(
        backendResponse.headers,
        backendRequestId
      ),
    });

    if (backendResponse.status === 401 && rawSession !== "public") {
      clearSessionCookie(response, rawSession);
    }

    console.info("BFF request completed.", {
      request_id: backendRequestId,
      session: rawSession,
      method: request.method,
      pathname,
      status: backendResponse.status,
      duration_ms: Math.round((performance.now() - startedAt) * 100) / 100,
    });

    return response;
  } catch (error) {
    console.error("Falha ao encaminhar requisição para o backend.", {
      request_id: requestId,
      session: rawSession,
      method: request.method,
      pathname,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return backendUnavailableResponse(requestId);
  }
}

export const dynamic = "force-dynamic";

export function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
