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
  ORGANIZER_SESSION_COOKIE,
} from "@/lib/server/session";

type BackendLoginResponse = {
  access_token?: unknown;
};

export async function POST(request: NextRequest) {
  if (!isTrustedRequestOrigin(request)) return invalidOriginResponse();

  const payload = await readJsonBody(request);
  if (!payload) return invalidPayloadResponse();

  try {
    const backendResponse = await fetch(buildBackendUrl("/auth/login"), {
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

    const data = JSON.parse(responseText) as BackendLoginResponse;
    if (typeof data.access_token !== "string" || !data.access_token) {
      console.error("O backend retornou uma resposta de login sem access_token.");
      return backendUnavailableResponse();
    }

    const response = NextResponse.json({ authenticated: true as const });
    response.headers.set("cache-control", "no-store");
    response.cookies.set(
      ORGANIZER_SESSION_COOKIE,
      data.access_token,
      getSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("Falha ao autenticar organizador no backend.", error);
    return backendUnavailableResponse();
  }
}
