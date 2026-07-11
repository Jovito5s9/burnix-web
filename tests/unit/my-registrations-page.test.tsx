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

describe("MyRegistrationsPage", () => {
  it("renderiza apenas as inscrições devolvidas para o participante autenticado", async () => {
    server.use(
      http.get(
        "*/api/backend/participant/participant/registrations",
        () =>
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
    expect(
      screen.queryByText("Evento secreto da participante B")
    ).not.toBeInTheDocument();
  });
});
