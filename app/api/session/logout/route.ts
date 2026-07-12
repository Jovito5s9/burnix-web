import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getOrCreateRequestId,
  invalidOriginResponse,
  isTrustedRequestOrigin,
  readJsonBody,
} from "@/lib/server/backend";
import {
  getSessionCookieOptions,
  ORGANIZER_SESSION_COOKIE,
  PARTICIPANT_SESSION_COOKIE,
} from "@/lib/server/session";

type LogoutScope = "organizer" | "participant" | "all";

function isLogoutScope(value: unknown): value is LogoutScope {
  return value === "organizer" || value === "participant" || value === "all";
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  if (!isTrustedRequestOrigin(request)) return invalidOriginResponse(requestId);

  const payload = (await readJsonBody(request)) as { session?: unknown } | null;
  const scope = isLogoutScope(payload?.session) ? payload.session : "all";
  const response = NextResponse.json({ logged_out: true, session: scope });
  const expiredCookie = {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  };

  if (scope === "organizer" || scope === "all") {
    response.cookies.set(ORGANIZER_SESSION_COOKIE, "", expiredCookie);
  }

  if (scope === "participant" || scope === "all") {
    response.cookies.set(PARTICIPANT_SESSION_COOKIE, "", expiredCookie);
  }

  response.headers.set("cache-control", "no-store");
  response.headers.set("x-request-id", requestId);
  return response;
}
