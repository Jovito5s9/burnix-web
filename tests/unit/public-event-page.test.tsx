import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { PublicEventPage } from "@/components/public/public-event-page";
import { publicEventFixture } from "@/tests/fixtures/participant";
import { server } from "@/tests/mocks/server";
import { renderWithQueryClient } from "@/tests/setup/render";

const publicContractUrl = "*/api/backend/public/public/contracts/10";

describe("PublicEventPage", () => {
  it("não renderiza o formulário quando o backend fecha as inscrições", async () => {
    server.use(
      http.get(publicContractUrl, () =>
        HttpResponse.json({
          ...publicEventFixture,
          registration_open: false,
          registration_state: "capacity_reached",
          registration_closed_reason: "capacity_reached",
          registration_closed_message:
            "As vagas disponíveis para este evento foram preenchidas.",
          remaining_capacity: 0,
        })
      )
    );

    renderWithQueryClient(<PublicEventPage id="10" />);

    expect(await screen.findByText("Vagas preenchidas")).toBeVisible();
    expect(
      screen.getByText(
        "As vagas disponíveis para este evento foram preenchidas."
      )
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Acessar Minhas inscrições" })
    ).toHaveAttribute("href", "/minhas-inscricoes");
    expect(
      screen.queryByRole("button", { name: "Inscrever-se" })
    ).not.toBeInTheDocument();
  });

  it("fecha a tela e refaz a consulta quando o prazo é atingido", async () => {
    let publicReads = 0;
    const serverTime = Date.now();
    const deadline = serverTime + 300;

    server.use(
      http.get(
        "*/api/backend/participant/participant-auth/me",
        () =>
          HttpResponse.json(
            {
              detail: {
                code: "participant_authentication_required",
                message: "Autenticação de participante necessária.",
              },
            },
            { status: 401 }
          )
      ),
      http.get(publicContractUrl, () => {
        publicReads += 1;
        const closed = Date.now() >= deadline;
        return HttpResponse.json({
          ...publicEventFixture,
          registration_open: !closed,
          registration_state: closed ? "deadline_passed" : "open",
          registration_closed_reason: closed ? "deadline_passed" : null,
          registration_closed_message: closed
            ? "As inscrições para este evento foram encerradas."
            : null,
          server_time: new Date(Date.now()).toISOString(),
          registration_deadline: new Date(deadline).toISOString(),
        });
      })
    );

    renderWithQueryClient(<PublicEventPage id="10" />);

    expect(await screen.findByText("Entre para se inscrever")).toBeVisible();
    expect(await screen.findByText("Inscrições encerradas")).toBeVisible();
    expect(publicReads).toBeGreaterThanOrEqual(2);
  });
});
