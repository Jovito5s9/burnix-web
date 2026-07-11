import type { Page, Route } from "@playwright/test";

import type { Participant } from "@/types/participant";
import type {
  ParticipantRegistration,
  ParticipantRegistrationDetail,
  ParticipantRegistrationPayment,
} from "@/types/participant-registration";
import type { ParticipantPaymentResponse, PublicPaymentRead } from "@/types/payment";
import type { PublicContract } from "@/types/public-contract";

export type MockApiState = {
  authenticated: boolean;
  participant: Participant;
  event: PublicContract;
  publicEventError: { status: number; detail: Record<string, unknown> } | null;
  registration: ParticipantRegistrationDetail;
  registrations: ParticipantRegistration[];
  registrationDetailSequence: ParticipantRegistrationDetail[];
  paymentResponses: ParticipantPaymentResponse[];
  duplicateOnCreate: boolean;
  deniedRegistrationIds: Set<number>;
  registrationDelayMs: number;
  lastRegistrationPayload: Record<string, unknown> | null;
  counters: {
    registrationsCreated: number;
    paymentsCreated: number;
    registrationDetailsRead: number;
  };
};

const participant: Participant = {
  id: 7,
  email: "participante.a@example.com",
  is_active: true,
  email_verified_at: null,
  created_at: "2026-07-10T10:00:00Z",
  updated_at: "2026-07-10T10:00:00Z",
};

const event: PublicContract = {
  id: 10,
  title: "Corrida Burnix 2026",
  description: "Evento esportivo com inscrição online.",
  status: "published",
  price: "100.00",
  currency: "BRL",
  capacity: 500,
  start_date: "2026-08-10",
  end_date: "2026-08-10",
  registration_deadline: "2026-08-05T23:59:59Z",
  form_fields: [],
};

export function pendingPayment(
  overrides: Partial<ParticipantRegistrationPayment> = {}
): ParticipantRegistrationPayment {
  return {
    id: 87,
    attempt_number: 1,
    status: "pending",
    amount: "100.00",
    currency: "BRL",
    checkout_url: "https://checkout.example/pix/87",
    qr_code_base64: "ZmFrZS1xci1jb2Rl",
    copy_and_paste: "00020126580014BR.GOV.BCB.PIX0136burnix-pix-code",
    expires_at: "2026-07-11T18:00:00Z",
    ...overrides,
  };
}

export function registrationDetail(
  overrides: Partial<ParticipantRegistrationDetail> = {}
): ParticipantRegistrationDetail {
  return {
    id: 42,
    registration_status: "pending_payment",
    payment_status: "pending",
    created_at: "2026-07-11T12:00:00Z",
    updated_at: "2026-07-11T12:00:00Z",
    name: "Participante A",
    email: participant.email,
    phone: "+5591999999999",
    document: "12345678900",
    sex: null,
    age: 30,
    extra_fields: null,
    event: {
      id: event.id,
      title: event.title,
      status: event.status,
      price: event.price,
      currency: event.currency,
      start_date: event.start_date,
      end_date: event.end_date,
    },
    latest_payment: null,
    ...overrides,
  };
}

export function registrationListItem(
  detail: ParticipantRegistrationDetail
): ParticipantRegistration {
  return {
    id: detail.id,
    registration_status: detail.registration_status,
    payment_status: detail.payment_status,
    created_at: detail.created_at,
    event: detail.event,
    latest_payment: detail.latest_payment,
  };
}

export function publicPayment(
  overrides: Partial<PublicPaymentRead> = {}
): PublicPaymentRead {
  const payment = pendingPayment();

  return {
    id: payment.id,
    registration_id: 42,
    attempt_number: payment.attempt_number,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    checkout_url: payment.checkout_url,
    qr_code_base64: payment.qr_code_base64,
    copy_and_paste: payment.copy_and_paste,
    expires_at: payment.expires_at,
    ...overrides,
  };
}

export function createMockApiState(
  overrides: Partial<MockApiState> = {}
): MockApiState {
  const defaultRegistration = registrationDetail();

  return {
    authenticated: false,
    participant: structuredClone(participant),
    event: structuredClone(event),
    publicEventError: null,
    registration: defaultRegistration,
    registrations: [registrationListItem(defaultRegistration)],
    registrationDetailSequence: [],
    paymentResponses: [publicPayment()],
    duplicateOnCreate: false,
    deniedRegistrationIds: new Set<number>(),
    registrationDelayMs: 0,
    lastRegistrationPayload: null,
    counters: {
      registrationsCreated: 0,
      paymentsCreated: 0,
      registrationDetailsRead: 0,
    },
    ...overrides,
  };
}

function json(route: Route, body: unknown, status = 200, headers = {}) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

function unauthorized(route: Route) {
  return json(
    route,
    {
      detail: {
        code: "participant_authentication_required",
        message: "Autenticação de participante necessária.",
      },
    },
    401
  );
}

function notFound(route: Route) {
  return json(
    route,
    {
      detail: {
        code: "registration_not_found",
        message: "Inscrição não encontrada.",
      },
    },
    404
  );
}

function asPayment(payment: PublicPaymentRead): ParticipantRegistrationPayment {
  return {
    id: payment.id,
    attempt_number: payment.attempt_number,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    checkout_url: payment.checkout_url,
    qr_code_base64: payment.qr_code_base64,
    copy_and_paste: payment.copy_and_paste,
    expires_at: payment.expires_at,
  };
}

function applyPaymentResult(
  state: MockApiState,
  result: ParticipantPaymentResponse
) {
  if (result.status === "not_required") {
    state.registration = {
      ...state.registration,
      registration_status: "confirmed",
      payment_status: "not_required",
      latest_payment: null,
    };
  } else {
    state.registration = {
      ...state.registration,
      registration_status:
        result.status === "paid"
          ? "confirmed"
          : result.status === "expired"
            ? "expired"
            : state.registration.registration_status,
      payment_status: result.status,
      latest_payment: asPayment(result),
    };
  }

  state.registrations = [registrationListItem(state.registration)];
}

export async function installMockApi(page: Page, state: MockApiState) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method();

    if (
      method === "GET" &&
      /^\/api\/backend\/public\/public\/contracts\/\d+$/.test(pathname)
    ) {
      if (state.publicEventError) {
        return json(
          route,
          { detail: state.publicEventError.detail },
          state.publicEventError.status
        );
      }

      const eventId = Number(pathname.split("/").at(-1));
      if (eventId !== state.event.id) {
        return json(
          route,
          {
            detail: {
              code: "event_not_published",
              message: "Evento não encontrado.",
            },
          },
          404
        );
      }
      return json(route, state.event);
    }

    if (
      method === "GET" &&
      pathname === "/api/backend/participant/participant-auth/me"
    ) {
      return state.authenticated
        ? json(route, state.participant)
        : unauthorized(route);
    }

    if (
      method === "POST" &&
      (pathname === "/api/session/participant/register" ||
        pathname === "/api/session/participant/login")
    ) {
      const body = (request.postDataJSON() ?? {}) as { email?: string };
      state.authenticated = true;
      if (body.email) {
        state.participant = { ...state.participant, email: body.email };
      }

      return json(
        route,
        { participant: state.participant },
        pathname.endsWith("register") ? 201 : 200,
        {
          "set-cookie":
            "burnix.participant_access_token=e2e-token; Path=/; HttpOnly; SameSite=Lax",
          "cache-control": "no-store",
        }
      );
    }

    if (
      method === "POST" &&
      /^\/api\/backend\/participant\/participant\/contracts\/\d+\/registrations$/.test(
        pathname
      )
    ) {
      state.counters.registrationsCreated += 1;
      state.lastRegistrationPayload = (request.postDataJSON() ?? {}) as Record<
        string,
        unknown
      >;

      if (state.registrationDelayMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, state.registrationDelayMs)
        );
      }

      if (state.duplicateOnCreate) {
        return json(
          route,
          {
            detail: {
              code: "registration_already_exists",
              message: "Você já possui uma inscrição neste evento.",
              registration_id: state.registration.id,
              can_resume_payment: true,
            },
          },
          409
        );
      }

      return json(route, state.registration, 201);
    }

    if (
      method === "GET" &&
      pathname === "/api/backend/participant/participant/registrations"
    ) {
      return state.authenticated
        ? json(route, state.registrations)
        : unauthorized(route);
    }

    const detailMatch = pathname.match(
      /^\/api\/backend\/participant\/participant\/registrations\/(\d+)$/
    );
    if (method === "GET" && detailMatch) {
      if (!state.authenticated) return unauthorized(route);

      const registrationId = Number(detailMatch[1]);
      if (
        state.deniedRegistrationIds.has(registrationId) ||
        registrationId !== state.registration.id
      ) {
        return notFound(route);
      }

      state.counters.registrationDetailsRead += 1;
      const index = Math.min(
        state.counters.registrationDetailsRead - 1,
        Math.max(0, state.registrationDetailSequence.length - 1)
      );
      const detail =
        state.registrationDetailSequence.length > 0
          ? state.registrationDetailSequence[index]
          : state.registration;
      state.registration = detail;
      state.registrations = [registrationListItem(detail)];
      return json(route, detail);
    }

    const paymentMatch = pathname.match(
      /^\/api\/backend\/participant\/participant\/registrations\/(\d+)\/payments\/pix$/
    );
    if (method === "POST" && paymentMatch) {
      if (!state.authenticated) return unauthorized(route);

      const registrationId = Number(paymentMatch[1]);
      if (
        state.deniedRegistrationIds.has(registrationId) ||
        registrationId !== state.registration.id
      ) {
        return notFound(route);
      }

      const responseIndex = Math.min(
        state.counters.paymentsCreated,
        Math.max(0, state.paymentResponses.length - 1)
      );
      state.counters.paymentsCreated += 1;
      const result = state.paymentResponses[responseIndex];

      if (!result) {
        return json(
          route,
          {
            detail: {
              code: "registration_payment_not_allowed",
              message: "Pagamento não permitido.",
            },
          },
          409
        );
      }

      applyPaymentResult(state, result);
      return json(route, result, 201);
    }

    if (method === "POST" && pathname === "/api/session/logout") {
      state.authenticated = false;
      return json(route, { ok: true });
    }

    return json(
      route,
      {
        detail: {
          code: "unhandled_mock_route",
          message: `Rota não simulada: ${method} ${pathname}`,
        },
      },
      500
    );
  });
}

export async function setParticipantSession(page: Page) {
  await page.context().addCookies([
    {
      name: "burnix.participant_access_token",
      value: "e2e-token",
      url: "http://127.0.0.1:3100",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
