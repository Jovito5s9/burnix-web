import { expect, test } from "@playwright/test";

import { createMockApiState, installMockApi } from "./support/mock-api";

test("evento sem vagas não exibe o formulário e preserva acesso às inscrições", async ({
  page,
}) => {
  const state = createMockApiState();
  state.event = {
    ...state.event,
    registration_open: false,
    registration_state: "capacity_reached",
    registration_closed_reason: "capacity_reached",
    registration_closed_message:
      "As vagas disponíveis para este evento foram preenchidas.",
    remaining_capacity: 0,
  };
  await installMockApi(page, state);

  await page.goto("/eventos/10");

  await expect(page.getByText("Vagas preenchidas")).toBeVisible();
  await expect(
    page.getByText("As vagas disponíveis para este evento foram preenchidas.")
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Acessar Minhas inscrições" })
  ).toHaveAttribute("href", "/minhas-inscricoes");
  await expect(
    page.getByRole("button", { name: "Inscrever-se" })
  ).toHaveCount(0);
});

test("prazo fecha automaticamente a página e refaz a consulta pública", async ({
  page,
}) => {
  const state = createMockApiState();
  state.event = {
    ...state.event,
    server_time: "2026-07-12T12:00:00Z",
    registration_deadline: "2026-07-12T12:00:01Z",
  };
  await installMockApi(page, state);

  await page.goto("/eventos/10");

  await expect(page.getByText("Entre para se inscrever")).toBeVisible();
  await expect(page.getByText("Inscrições encerradas")).toBeVisible();
  expect(state.counters.publicContractsRead).toBeGreaterThanOrEqual(2);
});

test("409 de prazo encerrado substitui o formulário sem erro genérico", async ({
  page,
}) => {
  const state = createMockApiState({
    authenticated: true,
    registrationCreateError: {
      code: "event_registration_closed",
      message: "As inscrições para este evento estão encerradas.",
    },
  });
  await installMockApi(page, state);

  await page.goto("/eventos/10");
  await page.getByLabel(/Nome completo/).fill("Participante A");
  await page
    .getByRole("button", { name: "Enviar inscrição e gerar Pix" })
    .click();

  await expect(page.getByText("Inscrições encerradas")).toBeVisible();
  await expect(
    page.getByText("As inscrições para este evento estão encerradas.")
  ).toBeVisible();
  await expect(
    page.getByText("Não foi possível concluir a inscrição")
  ).toHaveCount(0);
  expect(state.counters.registrationsCreated).toBe(1);
});
