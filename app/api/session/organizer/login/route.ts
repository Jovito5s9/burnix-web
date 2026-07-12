import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  backendUnavailableResponse,
  buildBackendUrl,
  copyBackendResponseHeaders,
  getAuthRequestBodyLimit,
  getOrCreateRequestId,
  invalidOriginResponse,
  invalidPayloadResponse,
  isRedirectStatus,
  isTrustedRequestOrigin,
  readJsonBody,
  RequestBodyTooLargeError,
  requestBodyTooLargeResponse,
  unexpectedBackendRedirectResponse,
} from "@/lib/server/backend";
import {
  clearSessionCookie,
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
  ORGANIZER_SESSION_COOKIE,
} from "@/lib/server/session";

type BackendLoginResponse = {
  access_token?: unknown;
  expires_in?: unknown;
};

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  if (!isTrustedRequestOrigin(request)) return invalidOriginResponse(requestId);

  let payload: unknown;
  try {
    payload = await readJsonBody(request, getAuthRequestBodyLimit());
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return requestBodyTooLargeResponse(requestId);
    }

    console.error("Falha ao ler o corpo da requisição.", {
      request_id: requestId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return invalidPayloadResponse(requestId);
  }

  if (!payload) return invalidPayloadResponse(requestId);

  try {
    const backendResponse = await fetch(buildBackendUrl("/auth/login"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "manual",
    });
    const backendRequestId =
      backendResponse.headers.get("x-request-id") ?? requestId;

    if (isRedirectStatus(backendResponse.status)) {
      console.error("Login do organizador recebeu redirect inesperado.", {
        request_id: backendRequestId,
        status: backendResponse.status,
      });
      return unexpectedBackendRedirectResponse(backendRequestId);
    }

    const responseText = await backendResponse.text();

    if (!backendResponse.ok) {
      const response = new NextResponse(responseText, {
        status: backendResponse.status,
        headers: copyBackendResponseHeaders(
          backendResponse.headers,
          backendRequestId
        ),
      });

      if (backendResponse.status === 401) {
        clearSessionCookie(response, "organizer");
      }

      return response;
    }

    const data = JSON.parse(responseText) as BackendLoginResponse;
    if (typeof data.access_token !== "string" || !data.access_token) {
      console.error("Resposta de login do organizador inválida.", {
        request_id: backendRequestId,
      });
      return backendUnavailableResponse(backendRequestId);
    }

    const maxAge = getSessionMaxAgeSeconds({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
    if (!maxAge) {
      console.error("Resposta de login sem expiração de sessão válida.", {
        request_id: backendRequestId,
      });
      return backendUnavailableResponse(backendRequestId);
    }

    const response = NextResponse.json({ authenticated: true as const });
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-request-id", backendRequestId);
    response.cookies.set(
      ORGANIZER_SESSION_COOKIE,
      data.access_token,
      getSessionCookieOptions(maxAge)
    );
    return response;
  } catch (error) {
    console.error("Falha ao autenticar organizador no backend.", {
      request_id: requestId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return backendUnavailableResponse(requestId);
  }
}
