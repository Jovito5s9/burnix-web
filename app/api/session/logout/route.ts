import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getAuthRequestBodyLimit,
  getOrCreateRequestId,
  invalidOriginResponse,
  invalidPayloadResponse,
  isTrustedRequestOrigin,
  readJsonBody,
  RequestBodyTooLargeError,
  requestBodyTooLargeResponse,
} from "@/lib/server/backend";
import { clearSessionCookie } from "@/lib/server/session";

type LogoutScope = "organizer" | "participant" | "all";

function isLogoutScope(value: unknown): value is LogoutScope {
  return value === "organizer" || value === "participant" || value === "all";
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  if (!isTrustedRequestOrigin(request)) return invalidOriginResponse(requestId);

  let payload: { session?: unknown } | null;
  try {
    payload = (await readJsonBody(
      request,
      getAuthRequestBodyLimit()
    )) as { session?: unknown } | null;
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

  const scope = isLogoutScope(payload?.session) ? payload.session : "all";
  const response = NextResponse.json({ logged_out: true, session: scope });

  if (scope === "organizer" || scope === "all") {
    clearSessionCookie(response, "organizer");
  }

  if (scope === "participant" || scope === "all") {
    clearSessionCookie(response, "participant");
  }

  response.headers.set("cache-control", "no-store");
  response.headers.set("x-request-id", requestId);
  return response;
}
