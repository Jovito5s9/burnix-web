import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/contracts", "/payments", "/settings"];
const publicPrefixes = ["/eventos", "/public"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("burnix.access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/contracts/:path*", "/payments/:path*", "/settings/:path*", "/eventos/:path*"],
};
