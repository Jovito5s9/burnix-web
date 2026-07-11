import { expect, test } from "@playwright/test";

import {
  createMockApiState,
  installMockApi,
  pendingPayment,
  publicPayment,
  registrationDetail,
  registrationListItem,
  setParticipantSession,
} from "./support/mock-api";

test("pagamento confirmado pelo backend atualiza a tela", async ({ page }) => {
  const pending = registrationDetail({
    latest_payment: pendingPayment(),
  });
  const paid = registrationDetail({
    registration_status: "confirmed",
    payment_status: "paid",
    latest_payment: pendingPayment({
      status: "paid",
      checkout_url: null,
      qr_code_base64: null,
      copy_and_paste: null,
    }),
  });
  const state = createMockApiState({
    authenticated: true,
    registrationDetailSequence: [pending, paid],
  });
  await installMockApi(page, state);

  await page.goto("/eventos/10");
  await page.getByLabel(/Nome completo/).fill("Participante A");
  await page
    .getByRole("button", { name: "Enviar inscrição e gerar Pix" })
    .click();

  await expect(
    page.getByText("Pagamento confirmado", { exact: true }).last()
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR Code para pagamento Pix" })
  ).toHaveCount(0);
});

test("pagamento expirado oferece e conclui uma nova tentativa", async ({ page }) => {
  const expired = registrationDetail({
    registration_status: "expired",
    payment_status: "expired",
    latest_payment: pendingPayment({
      status: "expired",
      expires_at: "2026-07-11T12:00:00Z",
    }),
  });
  const retryPayment = publicPayment({
    id: 88,
    attempt_number: 2,
    checkout_url: "https://checkout.example/pix/88",
    qr_code_base64: "bm92by1xci1jb2Rl",
    copy_and_paste: "nova-cobranca-pix",
    expires_at: "2026-07-11T19:00:00Z",
  });
  const state = createMockApiState({
    authenticated: true,
    registration: expired,
    registrations: [registrationListItem(expired)],
    paymentResponses: [retryPayment],
  });
  await installMockApi(page, state);
  await setParticipantSession(page);

  await page.goto("/minhas-inscricoes/42");

  await expect(
    page
      .getByText("Este Pix expirou. Gere uma nova cobrança", { exact: true })
      .last()
  ).toBeVisible();
  await page.getByRole("button", { name: "Gerar nova cobrança" }).click();

  await expect(page.getByText("nova-cobranca-pix")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR Code para pagamento Pix" })
  ).toBeVisible();
  expect(state.counters.paymentsCreated).toBe(1);
});

test("participante A não acessa dados da participante B", async ({ page }) => {
  const ownRegistration = registrationDetail();
  const state = createMockApiState({
    authenticated: true,
    registration: ownRegistration,
    registrations: [registrationListItem(ownRegistration)],
    deniedRegistrationIds: new Set([99]),
  });
  await installMockApi(page, state);
  await setParticipantSession(page);

  await page.goto("/minhas-inscricoes");
  await expect(page.getByText("Corrida Burnix 2026")).toBeVisible();
  await expect(page.getByText("Evento privado da participante B")).toHaveCount(0);

  await page.goto("/minhas-inscricoes/99");
  await expect(
    page.getByText("Não foi possível abrir esta inscrição")
  ).toBeVisible();
  await expect(page.getByText("Participante B")).toHaveCount(0);
});

test("evento gratuito confirma inscrição sem QR Code", async ({ page }) => {
  const freeRegistration = registrationDetail({
    registration_status: "confirmed",
    payment_status: "not_required",
    latest_payment: null,
    event: {
      ...registrationDetail().event,
      price: "0.00",
    },
  });
  const state = createMockApiState({
    authenticated: true,
    event: {
      ...createMockApiState().event,
      price: "0.00",
    },
    registration: freeRegistration,
    registrations: [registrationListItem(freeRegistration)],
    paymentResponses: [],
  });
  await installMockApi(page, state);

  await page.goto("/eventos/10");
  await page.getByLabel(/Nome completo/).fill("Participante A");
  await page
    .getByRole("button", { name: "Confirmar inscrição gratuita" })
    .click();

  await expect(
    page.getByText("Este evento é gratuito", { exact: true }).last()
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR Code para pagamento Pix" })
  ).toHaveCount(0);
  expect(state.counters.paymentsCreated).toBe(0);
});

test("evento em rascunho aparece como não encontrado", async ({ page }) => {
  const state = createMockApiState({
    publicEventError: {
      status: 404,
      detail: {
        code: "event_not_published",
        message: "Evento não encontrado.",
      },
    },
  });
  await installMockApi(page, state);

  await page.goto("/eventos/10");

  await expect(page.getByText("Evento não encontrado")).toBeVisible();
  await expect(page.getByText("Erro ao carregar evento")).toHaveCount(0);
});
