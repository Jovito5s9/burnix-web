import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ORGANIZER_SESSION_COOKIE,
  PARTICIPANT_SESSION_COOKIE,
} from "@/lib/server/session";

const organizerProtectedPrefixes = [
  "/dashboard",
  "/contracts",
  "/payments",
  "/settings",
  "/admin",
];
const participantProtectedPrefixes = ["/participante/minhas-inscricoes"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(loginUrl);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, organizerProtectedPrefixes)) {
    const token = request.cookies.get(ORGANIZER_SESSION_COOKIE)?.value;
    return token
      ? NextResponse.next()
      : redirectToLogin(request, "/login");
  }

  if (matchesPrefix(pathname, participantProtectedPrefixes)) {
    const token = request.cookies.get(PARTICIPANT_SESSION_COOKIE)?.value;
    return token
      ? NextResponse.next()
      : redirectToLogin(request, "/participante/entrar");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/payments/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/participante/minhas-inscricoes/:path*",
  ],
};
