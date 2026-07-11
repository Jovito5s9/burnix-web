import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  backendUnavailableResponse,
  buildBackendUrl,
  copyBackendResponseHeaders,
  invalidOriginResponse,
  isTrustedRequestOrigin,
} from "@/lib/server/backend";
import {
  getSessionCookieName,
  getSessionCookieOptions,
  type BackendSession,
} from "@/lib/server/session";

type RouteContext = {
  params: Promise<{
    session: string;
    path: string[];
  }>;
};

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isBackendSession(value: string): value is BackendSession {
  return value === "organizer" || value === "participant" || value === "public";
}

function isAllowedPath(session: BackendSession, pathname: string, method: string) {
  if (session === "public") {
    return method === "GET" && /^\/public\/contracts\/[^/]+$/.test(pathname);
  }

  if (session === "participant") {
    if (pathname === "/participant-auth/me") return method === "GET";

    if (/^\/participant\/registrations(?:\/\d+)?$/.test(pathname)) {
      return method === "GET";
    }

    if (/^\/participant\/contracts\/\d+\/registrations$/.test(pathname)) {
      return method === "POST";
    }

    if (/^\/participant\/registrations\/\d+\/payments\/pix$/.test(pathname)) {
      return method === "POST";
    }

    return false;
  }

  if (pathname === "/auth/register") return method === "POST";
  if (pathname === "/auth/me") return method === "GET";

  const organizerPrefixes = [
    "/contracts",
    "/clients",
    "/payments",
    "/billing-profiles",
    "/integrations",
    "/admin",
  ];

  if (pathname === "/payments/webhook/openpix") return false;

  return organizerPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function buildRequestHeaders(request: NextRequest, token: string | null) {
  const headers = new Headers();

  for (const name of ["accept", "accept-language", "content-type", "if-none-match"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  if (token) headers.set("authorization", `Bearer ${token}`);
  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  if (unsafeMethods.has(request.method) && !isTrustedRequestOrigin(request)) {
    return invalidOriginResponse();
  }

  const { session: rawSession, path } = await context.params;

  if (!isBackendSession(rawSession)) {
    return NextResponse.json(
      {
        detail: {
          code: "resource_not_found",
          message: "Recurso não encontrado.",
        },
      },
      { status: 404 }
    );
  }

  const pathname = `/${path.map(encodeURIComponent).join("/")}`;

  if (!isAllowedPath(rawSession, pathname, request.method)) {
    return NextResponse.json(
      {
        detail: {
          code: "permission_denied",
          message: "Esta operação não é permitida.",
        },
      },
      { status: 403 }
    );
  }

  const cookieName =
    rawSession === "public" ? null : getSessionCookieName(rawSession);
  const token = cookieName ? request.cookies.get(cookieName)?.value ?? null : null;
  const requestBody =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  try {
    const backendResponse = await fetch(
      buildBackendUrl(pathname, request.nextUrl.search),
      {
        method: request.method,
        headers: buildRequestHeaders(request, token),
        body: requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
        cache: "no-store",
        redirect: "manual",
      }
    );

    const response = new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: copyBackendResponseHeaders(backendResponse.headers),
    });

    if (backendResponse.status === 401 && cookieName) {
      response.cookies.set(cookieName, "", {
        ...getSessionCookieOptions(),
        expires: new Date(0),
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error("Falha ao encaminhar requisição para o backend.", {
      session: rawSession,
      pathname,
      error,
    });
    return backendUnavailableResponse();
  }
}

export const dynamic = "force-dynamic";

export function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
