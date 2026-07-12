import type { NextResponse } from "next/server";

export const ORGANIZER_SESSION_COOKIE = "burnix.access_token";
export const PARTICIPANT_SESSION_COOKIE = "burnix.participant_access_token";

export type BackendSession = "organizer" | "participant" | "public";
export type AuthenticatedSession = Exclude<BackendSession, "public">;

type TokenExpirySource = {
  access_token: string;
  expires_in?: unknown;
};

export function getSessionCookieName(session: AuthenticatedSession) {
  return session === "organizer"
    ? ORGANIZER_SESSION_COOKIE
    : PARTICIPANT_SESSION_COOKIE;
}

function parsePositiveSeconds(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" &&
    Number.isFinite(parsed) &&
    parsed > 0
    ? Math.max(1, Math.floor(parsed))
    : null;
}

function decodeJwtExpirationSeconds(token: string) {
  const segments = token.split(".");
  if (segments.length !== 3) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], "base64url").toString("utf8")
    ) as { exp?: unknown };
    const expiration = parsePositiveSeconds(payload.exp);
    if (!expiration) return null;

    const remainingSeconds = expiration - Math.floor(Date.now() / 1000);
    return remainingSeconds > 0 ? remainingSeconds : null;
  } catch {
    return null;
  }
}

export function getSessionMaxAgeSeconds(source: TokenExpirySource) {
  const expiresIn = parsePositiveSeconds(source.expires_in);
  const jwtRemainingSeconds = decodeJwtExpirationSeconds(source.access_token);

  if (expiresIn && jwtRemainingSeconds) {
    return Math.max(1, Math.min(expiresIn, jwtRemainingSeconds));
  }

  return expiresIn ?? jwtRemainingSeconds;
}

export function getSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearSessionCookie(
  response: NextResponse,
  session: AuthenticatedSession
) {
  response.cookies.set(getSessionCookieName(session), "", {
    ...getSessionCookieOptions(0),
    expires: new Date(0),
  });
}
