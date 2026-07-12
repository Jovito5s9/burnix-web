import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  backendUnavailableResponse,
  buildBackendUrl,
  copyBackendResponseHeaders,
  getOrCreateRequestId,
  invalidOriginResponse,
  invalidPayloadResponse,
  isRedirectStatus,
  isTrustedRequestOrigin,
  readJsonBody,
  unexpectedBackendRedirectResponse,
} from "@/lib/server/backend";
import {
  getSessionCookieOptions,
  PARTICIPANT_SESSION_COOKIE,
} from "@/lib/server/session";
import type { ParticipantBackendAuthResponse } from "@/types/participant-auth";

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  if (!isTrustedRequestOrigin(request)) return invalidOriginResponse(requestId);

  const payload = await readJsonBody(request);
  if (!payload) return invalidPayloadResponse(requestId);

  try {
    const backendResponse = await fetch(buildBackendUrl("/participant-auth/login"), {
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
      console.error("Login do participante recebeu redirect inesperado.", {
        request_id: backendRequestId,
        status: backendResponse.status,
      });
      return unexpectedBackendRedirectResponse(backendRequestId);
    }

    const responseText = await backendResponse.text();

    if (!backendResponse.ok) {
      return new NextResponse(responseText, {
        status: backendResponse.status,
        headers: copyBackendResponseHeaders(
          backendResponse.headers,
          backendRequestId
        ),
      });
    }

    const data = JSON.parse(responseText) as ParticipantBackendAuthResponse;
    if (!data.access_token || !data.participant) {
      console.error("Resposta de login do participante inválida.", {
        request_id: backendRequestId,
      });
      return backendUnavailableResponse(backendRequestId);
    }

    const response = NextResponse.json({ participant: data.participant });
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-request-id", backendRequestId);
    response.cookies.set(
      PARTICIPANT_SESSION_COOKIE,
      data.access_token,
      getSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("Falha ao autenticar participante no backend.", {
      request_id: requestId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return backendUnavailableResponse(requestId);
  }
}
