import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(() => (port ? resolve(port) : reject(new Error("Porta indisponível"))));
    });
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function sendJson(response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

async function createMockBackend() {
  const calls = [];
  const server = http.createServer(async (request, response) => {
    const bodyText = await readRequestBody(request);
    const body = bodyText ? JSON.parse(bodyText) : null;
    calls.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization ?? null,
      requestId: request.headers["x-request-id"] ?? null,
      body,
    });

    if (request.method === "POST" && request.url === "/participant-auth/login") {
      return sendJson(response, 200, {
        access_token: "participant-secret-token",
        token_type: "bearer",
        expires_in: 3600,
        participant: {
          id: 12,
          email: "participante@example.com",
          is_active: true,
          email_verified_at: null,
          created_at: "2026-07-10T10:00:00Z",
          updated_at: "2026-07-10T10:00:00Z",
        },
      });
    }

    if (request.method === "POST" && request.url === "/participant-auth/register") {
      return sendJson(response, 201, {
        access_token: "participant-register-secret",
        token_type: "bearer",
        expires_in: 3600,
        participant: {
          id: 13,
          email: "novo@example.com",
          is_active: true,
          email_verified_at: null,
          created_at: "2026-07-10T10:00:00Z",
          updated_at: "2026-07-10T10:00:00Z",
        },
      });
    }

    if (request.method === "POST" && request.url === "/auth/login") {
      return sendJson(response, 200, {
        access_token: "organizer-secret-token",
        token_type: "bearer",
        expires_in: 3600,
      });
    }

    if (request.method === "GET" && request.url === "/participant-auth/me") {
      assert.equal(request.headers.authorization, "Bearer participant-secret-token");
      return sendJson(response, 200, {
        id: 12,
        email: "participante@example.com",
        is_active: true,
        email_verified_at: null,
        created_at: "2026-07-10T10:00:00Z",
        updated_at: "2026-07-10T10:00:00Z",
      });
    }

    if (request.method === "GET" && request.url === "/participant/registrations") {
      assert.equal(request.headers.authorization, "Bearer participant-secret-token");
      return sendJson(response, 200, [
        {
          id: 44,
          registration_status: "pending_payment",
          payment_status: "pending",
          created_at: "2026-07-10T10:00:00Z",
          event: {
            id: 7,
            title: "Evento",
            status: "published",
            price: "10.00",
            currency: "BRL",
            start_date: "2026-08-01",
            end_date: "2026-08-01",
          },
          latest_payment: {
            id: 90,
            attempt_number: 1,
            status: "pending",
            amount: "10.00",
            currency: "BRL",
            checkout_url: "https://example.test/checkout",
            qr_code_base64: null,
            copy_and_paste: "PIX-CODE",
            expires_at: "2026-07-10T11:00:00Z",
          },
        },
      ]);
    }

    if (request.method === "GET" && request.url === "/participant/registrations/44") {
      assert.equal(request.headers.authorization, "Bearer participant-secret-token");
      return sendJson(response, 200, {
        id: 44,
        registration_status: "pending_payment",
        payment_status: "pending",
        created_at: "2026-07-10T10:00:00Z",
        event: {
          id: 7,
          title: "Evento",
          status: "published",
          price: "10.00",
          currency: "BRL",
          start_date: "2026-08-01",
          end_date: "2026-08-01",
        },
        latest_payment: {
          id: 90,
          attempt_number: 1,
          status: "pending",
          amount: "10.00",
          currency: "BRL",
          checkout_url: "https://example.test/checkout",
          qr_code_base64: null,
          copy_and_paste: "PIX-CODE",
          expires_at: "2026-07-10T11:00:00Z",
        },
        name: "Pessoa Participante",
        email: "participante@example.com",
        phone: null,
        document: null,
        sex: null,
        age: null,
        extra_fields: { camiseta: "M" },
        updated_at: "2026-07-10T10:00:00Z",
      });
    }

    if (request.method === "GET" && request.url === "/auth/me") {
      assert.equal(request.headers.authorization, "Bearer organizer-secret-token");
      return sendJson(response, 200, {
        id: 3,
        email: "organizador@example.com",
        role: "contractor",
        is_active: true,
      });
    }

    if (
      request.method === "GET" &&
      request.url === "/contracts?skip=0&limit=50"
    ) {
      assert.equal(request.headers.authorization, "Bearer organizer-secret-token");
      assert.equal(request.headers["x-request-id"], "bff-smoke-collections");
      return sendJson(response, 200, [], {
        "x-request-id": request.headers["x-request-id"],
      });
    }

    if (
      request.method === "GET" &&
      request.url === "/payments?skip=0&limit=50"
    ) {
      assert.equal(request.headers.authorization, "Bearer organizer-secret-token");
      assert.equal(request.headers["x-request-id"], "bff-smoke-collections");
      return sendJson(response, 200, [], {
        "x-request-id": request.headers["x-request-id"],
      });
    }

    if (
      request.method === "GET" &&
      request.url === "/clients?skip=0&limit=100"
    ) {
      assert.equal(request.headers.authorization, "Bearer organizer-secret-token");
      assert.equal(request.headers["x-request-id"], "bff-smoke-collections");
      return sendJson(response, 200, [], {
        "x-request-id": request.headers["x-request-id"],
      });
    }

    if (request.method === "GET" && request.url === "/contracts/redirect-test") {
      response.writeHead(307, {
        location: "/contracts/redirect-target",
        "x-request-id": request.headers["x-request-id"] ?? "backend-redirect",
      });
      response.end();
      return;
    }

    if (
      request.method === "POST" &&
      request.url === "/participant/contracts/7/registrations"
    ) {
      assert.equal(request.headers.authorization, "Bearer participant-secret-token");
      assert.equal(Object.hasOwn(body, "participant_id"), false);
      assert.equal(Object.hasOwn(body, "email"), false);

      if (body.name === "Pessoa Duplicada") {
        return sendJson(response, 409, {
          detail: {
            code: "registration_already_exists",
            message: "Você já possui uma inscrição neste evento.",
            registration_id: 44,
            can_resume_payment: true,
          },
        });
      }

      return sendJson(response, 201, {
        id: 44,
        registration_status: "pending_payment",
        payment_status: "pending",
        created_at: "2026-07-10T10:00:00Z",
        event: {
          id: 7,
          title: "Evento",
          status: "published",
          price: "10.00",
          currency: "BRL",
          start_date: "2026-08-01",
          end_date: "2026-08-01",
        },
        latest_payment: null,
        name: body.name,
        email: "participante@example.com",
        phone: null,
        document: null,
        sex: null,
        age: null,
        extra_fields: {},
        updated_at: "2026-07-10T10:00:00Z",
      });
    }

    if (
      request.method === "POST" &&
      request.url === "/participant/registrations/44/payments/pix"
    ) {
      assert.equal(request.headers.authorization, "Bearer participant-secret-token");
      assert.equal(typeof body.idempotency_key, "string");
      assert.match(
        body.idempotency_key,
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      return sendJson(response, 201, {
        id: 90,
        registration_id: 44,
        attempt_number: 1,
        status: "pending",
        amount: "10.00",
        currency: "BRL",
        checkout_url: "https://example.test/checkout",
        qr_code_base64: null,
        copy_and_paste: "PIX-CODE",
        expires_at: "2026-07-10T11:00:00Z",
      });
    }

    if (request.method === "GET" && request.url === "/public/contracts/7") {
      assert.equal(request.headers.authorization, undefined);
      return sendJson(response, 200, {
        id: 7,
        title: "Evento público",
        description: null,
        status: "published",
        price: "10.00",
        currency: "BRL",
        capacity: 100,
        start_date: "2026-08-01",
        end_date: "2026-08-01",
        registration_deadline: null,
        form_fields: [],
      });
    }

    return sendJson(response, 404, {
      detail: { code: "resource_not_found", message: "Não encontrado." },
    });
  });

  const port = await getFreePort();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  return { server, port, calls };
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js encerrou antes do smoke test (código ${child.exitCode}).`);
    }

    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Aguarda o processo começar a aceitar conexões.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Next.js não ficou disponível dentro do prazo do smoke test.");
}

function cookiePair(setCookieHeader) {
  assert.ok(setCookieHeader, "Set-Cookie ausente");
  return setCookieHeader.split(";", 1)[0];
}

async function main() {
  const backend = await createMockBackend();
  const nextPort = await getFreePort();
  const origin = `http://127.0.0.1:${nextPort}`;
  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(nextPort)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        API_URL: `http://127.0.0.1:${backend.port}`,
        APP_ORIGIN: origin,
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let logs = "";
  child.stdout.on("data", (chunk) => (logs += chunk.toString()));
  child.stderr.on("data", (chunk) => (logs += chunk.toString()));

  try {
    await waitForServer(origin, child);

    const participantLogin = await fetch(`${origin}/api/session/participant/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email: "participante@example.com", password: "12345678" }),
    });
    assert.equal(participantLogin.status, 200);
    const participantLoginBody = await participantLogin.json();
    assert.equal(Object.hasOwn(participantLoginBody, "access_token"), false);
    assert.equal(participantLoginBody.participant.email, "participante@example.com");
    const participantSetCookie = participantLogin.headers.get("set-cookie");
    assert.match(participantSetCookie, /burnix\.participant_access_token=/);
    assert.match(participantSetCookie, /HttpOnly/i);
    assert.match(participantSetCookie, /Secure/i);
    assert.match(participantSetCookie, /SameSite=Lax/i);
    assert.match(participantSetCookie, /Path=\//i);
    assert.match(participantSetCookie, /Max-Age=3600/i);
    const participantCookie = cookiePair(participantSetCookie);

    const participantMe = await fetch(
      `${origin}/api/backend/participant/participant-auth/me`,
      { headers: { cookie: participantCookie } }
    );
    assert.equal(participantMe.status, 200);
    assert.equal((await participantMe.json()).id, 12);

    const protectedRegistrationsWithoutSession = await fetch(
      `${origin}/minhas-inscricoes`,
      { redirect: "manual" }
    );
    assert.equal(protectedRegistrationsWithoutSession.status, 307);
    assert.match(
      protectedRegistrationsWithoutSession.headers.get("location"),
      /\/participante\/entrar\?next=%2Fminhas-inscricoes/
    );

    const protectedRegistrationsWithOrganizerOnly = await fetch(
      `${origin}/minhas-inscricoes`,
      { headers: { cookie: "burnix.access_token=organizer-secret-token" }, redirect: "manual" }
    );
    assert.equal(protectedRegistrationsWithOrganizerOnly.status, 307);

    const registrationsPage = await fetch(`${origin}/minhas-inscricoes`, {
      headers: { cookie: participantCookie },
      redirect: "manual",
    });
    assert.equal(registrationsPage.status, 200);

    const myRegistrations = await fetch(
      `${origin}/api/backend/participant/participant/registrations`,
      { headers: { cookie: participantCookie } }
    );
    assert.equal(myRegistrations.status, 200);
    const myRegistrationsBody = await myRegistrations.json();
    assert.equal(myRegistrationsBody.length, 1);
    assert.equal(myRegistrationsBody[0].event.title, "Evento");

    const myRegistrationDetail = await fetch(
      `${origin}/api/backend/participant/participant/registrations/44`,
      { headers: { cookie: participantCookie } }
    );
    assert.equal(myRegistrationDetail.status, 200);
    const myRegistrationDetailBody = await myRegistrationDetail.json();
    assert.equal(myRegistrationDetailBody.email, "participante@example.com");
    assert.equal(myRegistrationDetailBody.latest_payment.attempt_number, 1);

    const registration = await fetch(
      `${origin}/api/backend/participant/participant/contracts/7/registrations`,
      {
        method: "POST",
        headers: {
          cookie: participantCookie,
          "content-type": "application/json",
          origin,
        },
        body: JSON.stringify({ name: "Pessoa Participante", extra_fields: {} }),
      }
    );
    assert.equal(registration.status, 201);
    assert.equal((await registration.json()).id, 44);

    const duplicateRegistration = await fetch(
      `${origin}/api/backend/participant/participant/contracts/7/registrations`,
      {
        method: "POST",
        headers: {
          cookie: participantCookie,
          "content-type": "application/json",
          origin,
        },
        body: JSON.stringify({ name: "Pessoa Duplicada", extra_fields: {} }),
      }
    );
    assert.equal(duplicateRegistration.status, 409);
    const duplicateBody = await duplicateRegistration.json();
    assert.equal(duplicateBody.detail.code, "registration_already_exists");
    assert.equal(duplicateBody.detail.registration_id, 44);
    assert.equal(duplicateBody.detail.can_resume_payment, true);

    const idempotencyKey = crypto.randomUUID();
    const payment = await fetch(
      `${origin}/api/backend/participant/participant/registrations/44/payments/pix`,
      {
        method: "POST",
        headers: {
          cookie: participantCookie,
          "content-type": "application/json",
          origin,
        },
        body: JSON.stringify({ idempotency_key: idempotencyKey }),
      }
    );
    assert.equal(payment.status, 201);
    assert.equal((await payment.json()).registration_id, 44);

    const paymentRetry = await fetch(
      `${origin}/api/backend/participant/participant/registrations/44/payments/pix`,
      {
        method: "POST",
        headers: {
          cookie: participantCookie,
          "content-type": "application/json",
          origin,
        },
        body: JSON.stringify({ idempotency_key: idempotencyKey }),
      }
    );
    assert.equal(paymentRetry.status, 201);
    assert.equal((await paymentRetry.json()).id, 90);

    const paymentCalls = backend.calls.filter(
      (call) =>
        call.method === "POST" &&
        call.url === "/participant/registrations/44/payments/pix"
    );
    assert.equal(paymentCalls.length, 2);
    assert.equal(paymentCalls[0].body.idempotency_key, idempotencyKey);
    assert.equal(paymentCalls[1].body.idempotency_key, idempotencyKey);

    const participantCannotUseOrganizerProxy = await fetch(
      `${origin}/api/backend/participant/auth/me`,
      { headers: { cookie: participantCookie } }
    );
    assert.equal(participantCannotUseOrganizerProxy.status, 403);

    const organizerLogin = await fetch(`${origin}/api/session/organizer/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email: "organizador@example.com", password: "12345678" }),
    });
    assert.equal(organizerLogin.status, 200);
    const organizerLoginBody = await organizerLogin.json();
    assert.equal(Object.hasOwn(organizerLoginBody, "access_token"), false);
    const organizerSetCookie = organizerLogin.headers.get("set-cookie");
    assert.match(organizerSetCookie, /burnix\.access_token=/);
    assert.match(organizerSetCookie, /Max-Age=3600/i);
    assert.equal(organizerSetCookie.includes("burnix.participant_access_token"), false);
    const organizerCookie = cookiePair(organizerSetCookie);

    const organizerMe = await fetch(`${origin}/api/backend/organizer/auth/me`, {
      headers: { cookie: organizerCookie },
    });
    assert.equal(organizerMe.status, 200);
    assert.equal((await organizerMe.json()).id, 3);

    for (const path of [
      "/contracts?skip=0&limit=50",
      "/payments?skip=0&limit=50",
      "/clients?skip=0&limit=100",
    ]) {
      const collectionResponse = await fetch(
        `${origin}/api/backend/organizer${path}`,
        {
          headers: {
            cookie: organizerCookie,
            "x-request-id": "bff-smoke-collections",
          },
          redirect: "manual",
        }
      );
      assert.equal(collectionResponse.status, 200);
      assert.equal(
        collectionResponse.headers.get("x-request-id"),
        "bff-smoke-collections"
      );
      assert.equal(collectionResponse.headers.get("location"), null);
    }

    const unexpectedRedirect = await fetch(
      `${origin}/api/backend/organizer/contracts/redirect-test`,
      {
        headers: { cookie: organizerCookie },
        redirect: "manual",
      }
    );
    assert.equal(unexpectedRedirect.status, 502);
    assert.equal(unexpectedRedirect.headers.get("location"), null);
    assert.equal(
      (await unexpectedRedirect.json()).detail.code,
      "unexpected_backend_redirect"
    );

    const dashboardWithParticipantOnly = await fetch(`${origin}/dashboard`, {
      headers: { cookie: participantCookie },
      redirect: "manual",
    });
    assert.equal(dashboardWithParticipantOnly.status, 307);
    assert.match(dashboardWithParticipantOnly.headers.get("location"), /\/login\?next=%2Fdashboard/);

    const publicEvent = await fetch(
      `${origin}/api/backend/public/public/contracts/7`
    );
    assert.equal(publicEvent.status, 200);
    assert.equal((await publicEvent.json()).id, 7);

    const crossOriginRequest = await fetch(
      `${origin}/api/session/participant/login`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.example",
        },
        body: JSON.stringify({ email: "x@example.com", password: "12345678" }),
      }
    );
    assert.equal(crossOriginRequest.status, 403);

    const logout = await fetch(`${origin}/api/session/logout`, {
      method: "POST",
      headers: {
        cookie: `${participantCookie}; ${organizerCookie}`,
        "content-type": "application/json",
        origin,
      },
      body: JSON.stringify({ session: "participant" }),
    });
    assert.equal(logout.status, 200);
    const logoutCookie = logout.headers.get("set-cookie");
    assert.match(logoutCookie, /burnix\.participant_access_token=/);
    assert.equal(logoutCookie.includes("burnix.access_token="), false);

    console.log("Smoke BFF aprovado: sessões separadas, URLs canônicas, request ID, redirects controlados, recuperação do 409 e idempotência do Pix preservada.");
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => backend.server.close(resolve));
  }
}

await main();
