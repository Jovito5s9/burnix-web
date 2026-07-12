import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildBackendUrl,
  copyBackendResponseHeaders,
  getOrCreateRequestId,
  isRedirectStatus,
  readRequestBody,
  RequestBodyTooLargeError,
  requestBodyTooLargeResponse,
  unexpectedBackendRedirectResponse,
} from "@/lib/server/backend";
import { getSessionMaxAgeSeconds } from "@/lib/server/session";

describe("contrato do proxy BFF", () => {
  const originalApiUrl = process.env.API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = originalApiUrl;
  });

  it("monta URLs canônicas sem acrescentar barra final", () => {
    process.env.API_URL = "http://backend.internal:3000/";

    expect(buildBackendUrl("/contracts", "?skip=0&limit=50")).toBe(
      "http://backend.internal:3000/contracts?skip=0&limit=50"
    );
    expect(buildBackendUrl("payments")).toBe(
      "http://backend.internal:3000/payments"
    );
  });

  it("preserva request IDs válidos e substitui valores inválidos", () => {
    const validRequest = new NextRequest("http://localhost/api", {
      headers: { "x-request-id": "frontend-request_123" },
    });
    const invalidRequest = new NextRequest("http://localhost/api", {
      headers: { "x-request-id": "valor inválido com espaço" },
    });

    expect(getOrCreateRequestId(validRequest)).toBe("frontend-request_123");
    expect(getOrCreateRequestId(invalidRequest)).toMatch(
      /^[0-9a-f-]{36}$/i
    );
  });

  it("não repassa Location e mantém headers operacionais seguros", () => {
    const source = new Headers({
      location: "/contracts/",
      "content-type": "application/json",
      "retry-after": "60",
      "x-request-id": "backend-request-1",
    });

    const copied = copyBackendResponseHeaders(source, "fallback-request");

    expect(copied.get("location")).toBeNull();
    expect(copied.get("content-type")).toBe("application/json");
    expect(copied.get("retry-after")).toBe("60");
    expect(copied.get("x-request-id")).toBe("backend-request-1");
    expect(copied.get("cache-control")).toBe("no-store");
  });

  it("classifica redirects e produz erro controlado sem Location", async () => {
    expect(isRedirectStatus(307)).toBe(true);
    expect(isRedirectStatus(200)).toBe(false);

    const response = unexpectedBackendRedirectResponse("request-redirect");
    expect(response.status).toBe(502);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-request-id")).toBe("request-redirect");
    await expect(response.json()).resolves.toMatchObject({
      detail: { code: "unexpected_backend_redirect" },
    });
  });

  it("rejeita corpos acima do limite antes de encaminhá-los", async () => {
    const request = new NextRequest("http://localhost/api/backend/organizer/contracts", {
      method: "POST",
      body: "12345",
      headers: { "content-type": "application/json" },
    });

    await expect(readRequestBody(request, 4)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );

    const response = requestBodyTooLargeResponse("request-large");
    expect(response.status).toBe(413);
    expect(response.headers.get("x-request-id")).toBe("request-large");
    await expect(response.json()).resolves.toMatchObject({
      detail: { code: "request_body_too_large" },
    });
  });

  it("alinha o maxAge do cookie ao menor prazo entre expires_in e JWT", () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 120;
    const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString(
      "base64url"
    );
    const token = `header.${payload}.signature`;

    expect(
      getSessionMaxAgeSeconds({ access_token: token, expires_in: 45 })
    ).toBe(45);

    const jwtOnly = getSessionMaxAgeSeconds({ access_token: token });
    expect(jwtOnly).toBeGreaterThanOrEqual(118);
    expect(jwtOnly).toBeLessThanOrEqual(120);
  });

});
