import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  backendUnavailableResponse,
  buildBackendUrl,
  copyBackendResponseHeaders,
  invalidOriginResponse,
  invalidPayloadResponse,
  isTrustedRequestOrigin,
  readJsonBody,
} from "@/lib/server/backend";
import {
  getSessionCookieOptions,
  PARTICIPANT_SESSION_COOKIE,
} from "@/lib/server/session";
import type { ParticipantBackendAuthResponse } from "@/types/participant-auth";

export async function POST(request: NextRequest) {
  if (!isTrustedRequestOrigin(request)) return invalidOriginResponse();

  const payload = await readJsonBody(request);
  if (!payload) return invalidPayloadResponse();

  try {
    const backendResponse = await fetch(buildBackendUrl("/participant-auth/login"), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await backendResponse.text();

    if (!backendResponse.ok) {
      return new NextResponse(responseText, {
        status: backendResponse.status,
        headers: copyBackendResponseHeaders(backendResponse.headers),
      });
    }

    const data = JSON.parse(responseText) as ParticipantBackendAuthResponse;
    if (!data.access_token || !data.participant) {
      console.error("O backend retornou uma resposta de login de participante inválida.");
      return backendUnavailableResponse();
    }

    const response = NextResponse.json({ participant: data.participant });
    response.headers.set("cache-control", "no-store");
    response.cookies.set(
      PARTICIPANT_SESSION_COOKIE,
      data.access_token,
      getSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("Falha ao autenticar participante no backend.", error);
    return backendUnavailableResponse();
  }
}
