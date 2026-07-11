import { expect, test } from "@playwright/test";

import {
  createMockApiState,
  installMockApi,
} from "./support/mock-api";

test("visitante cria conta, retorna ao evento, cria inscrição e recebe o Pix", async ({
  page,
}) => {
  const state = createMockApiState();
  await installMockApi(page, state);

  await page.goto("/eventos/10");

  await expect(page.getByRole("heading", { name: "Corrida Burnix 2026" })).toBeVisible();
  await expect(page.getByText("Entre para se inscrever")).toBeVisible();

  await page.getByRole("button", { name: "Inscrever-se" }).click();
  await expect(page).toHaveURL(/\/participante\/entrar\?next=%2Feventos%2F10/);

  await page.getByRole("link", { name: "Criar conta de participante" }).click();
  await expect(page).toHaveURL(/\/participante\/cadastro\?next=%2Feventos%2F10/);

  await page.getByLabel("E-mail").fill("novo.participante@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-segura-123");
  await page.getByLabel("Confirmar senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Criar conta de participante" }).click();

  await expect(page).toHaveURL(/\/eventos\/10$/);
  await expect(page.getByText("Participante autenticado")).toBeVisible();

  await page.getByLabel(/Nome completo/).fill("Novo Participante");
  await page
    .getByRole("button", { name: "Enviar inscrição e gerar Pix" })
    .click();

  await expect(page.getByText("Inscrição localizada")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR Code para pagamento Pix" })
  ).toBeVisible();
  await expect(page.getByText(/burnix-pix-code/)).toBeVisible();

  expect(state.counters.registrationsCreated).toBe(1);
  expect(state.counters.paymentsCreated).toBe(1);
  expect(state.lastRegistrationPayload).toMatchObject({
    name: "Novo Participante",
  });
  expect(state.lastRegistrationPayload).not.toHaveProperty("email");
});
