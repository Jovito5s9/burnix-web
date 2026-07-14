import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { MyRegistrationsPage } from "@/components/participant/my-registrations-page";
import {
  buildRegistrationListItem,
  pendingPaymentFixture,
} from "@/tests/fixtures/participant";
import { server } from "@/tests/mocks/server";
import { renderWithQueryClient } from "@/tests/setup/render";

const registrationsUrl =
  "*/api/backend/participant/participant/registrations";

describe("MyRegistrationsPage", () => {
  it("renderiza as inscrições retornadas pela API", async () => {
    server.use(
      http.get(registrationsUrl, () =>
        HttpResponse.json([
          buildRegistrationListItem({
            registration_status: "confirmed",
            payment_status: "paid",
            latest_payment: {
              ...pendingPaymentFixture,
              status: "paid",
              checkout_url: null,
              qr_code_base64: null,
              copy_and_paste: null,
            },
          }),
        ])
      )
    );

    renderWithQueryClient(<MyRegistrationsPage />);

    expect(await screen.findByText("Corrida Burnix 2026")).toBeVisible();
    expect(screen.getByText("Pagamento confirmado")).toBeVisible();
    expect(screen.getByText("1 inscrição")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ver inscrição" })
    ).toHaveAttribute("href", "/minhas-inscricoes/42");
  });

  it("exibe um estado vazio quando não existem inscrições", async () => {
    server.use(
      http.get(registrationsUrl, () => HttpResponse.json([]))
    );

    renderWithQueryClient(<MyRegistrationsPage />);

    expect(
      await screen.findByText("Você ainda não se inscreveu em nenhum evento.")
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
