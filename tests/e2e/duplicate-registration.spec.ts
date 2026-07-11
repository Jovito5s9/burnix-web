import { expect, test } from "@playwright/test";

import {
  createMockApiState,
  installMockApi,
  pendingPayment,
  registrationDetail,
} from "./support/mock-api";

test("cliques repetidos durante o envio não criam inscrição duplicada", async ({
  page,
}) => {
  const state = createMockApiState({
    authenticated: true,
    registrationDelayMs: 250,
  });
  await installMockApi(page, state);

  await page.goto("/eventos/10");
  await page.getByLabel(/Nome completo/).fill("Participante A");

  const submit = page.getByRole("button", {
    name: "Enviar inscrição e gerar Pix",
  });
  await submit.evaluate((element: HTMLButtonElement) => {
    element.click();
    element.click();
  });

  await expect(
    page.getByRole("img", { name: "QR Code para pagamento Pix" })
  ).toBeVisible();
  expect(state.counters.registrationsCreated).toBe(1);
  expect(state.counters.paymentsCreated).toBe(1);
});

test("409 abre a inscrição existente e não repete a criação", async ({ page }) => {
  const existing = registrationDetail({
    latest_payment: pendingPayment(),
  });
  const state = createMockApiState({
    authenticated: true,
    registration: existing,
    duplicateOnCreate: true,
  });
  await installMockApi(page, state);

  await page.goto("/eventos/10");
  await page.getByLabel(/Nome completo/).fill("Participante A");
  await page
    .getByRole("button", { name: "Enviar inscrição e gerar Pix" })
    .click();

  await expect(
    page.getByText("Você já está inscrito neste evento")
  ).toBeVisible();
  await expect(page.getByText("Inscrição localizada")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR Code para pagamento Pix" })
  ).toBeVisible();

  expect(state.counters.registrationsCreated).toBe(1);
  expect(state.counters.paymentsCreated).toBe(0);
});
