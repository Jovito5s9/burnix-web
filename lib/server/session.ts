export const ORGANIZER_SESSION_COOKIE = "burnix.access_token";
export const PARTICIPANT_SESSION_COOKIE = "burnix.participant_access_token";

export type BackendSession = "organizer" | "participant" | "public";
export type AuthenticatedSession = Exclude<BackendSession, "public">;

export function getSessionCookieName(session: AuthenticatedSession) {
  return session === "organizer"
    ? ORGANIZER_SESSION_COOKIE
    : PARTICIPANT_SESSION_COOKIE;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
