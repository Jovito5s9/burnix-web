import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ContractsPage } from "@/components/dashboard/contracts-page";
import { server } from "@/tests/mocks/server";
import { renderWithQueryClient } from "@/tests/setup/render";
import type { Contract } from "@/types/contract";

const contractsUrl = "*/api/backend/organizer/contracts";

function buildContract(id: number): Contract {
  const timestamp = "2026-07-12T12:00:00.000Z";

  return {
    id,
    owner_user_id: 1,
    client_id: null,
    title: `Evento ${id}`,
    description: null,
    status: "draft",
    version: 1,
    price: "0.00",
    currency: "BRL",
    capacity: 100,
    start_date: null,
    end_date: null,
    start_at: "2026-08-01T12:00:00.000Z",
    end_at: "2026-08-01T14:00:00.000Z",
    timezone: "America/Belem",
    registration_deadline: "2026-07-31T23:59:00.000Z",
    payment_config: null,
    published_at: null,
    closed_at: null,
    cancelled_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function buildPage(startId: number, size: number) {
  return Array.from({ length: size }, (_, index) => buildContract(startId + index));
}

describe("paginação da lista de eventos", () => {
  it("usa o total global e bloqueia a próxima página quando há exatamente 20 itens no total", async () => {
    server.use(
      http.get(contractsUrl, () =>
        HttpResponse.json({
          items: buildPage(1, 20),
          total: 20,
          skip: 0,
          limit: 20,
        })
      )
    );

    renderWithQueryClient(<ContractsPage />);

    expect(await screen.findByText("Evento 20")).toBeVisible();
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "P" &&
        element.textContent?.trim() ===
          "20 eventos no total. Exibindo 20 eventos nesta página. Página 1 de 1."
      )
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("avança somente quando skip + itens da página é menor que o total", async () => {
    const requestedSkips: number[] = [];

    server.use(
      http.get(contractsUrl, ({ request }) => {
        const skip = Number(new URL(request.url).searchParams.get("skip") ?? 0);
        requestedSkips.push(skip);

        if (skip === 20) {
          return HttpResponse.json({
            items: [buildContract(21)],
            total: 21,
            skip: 20,
            limit: 20,
          });
        }

        return HttpResponse.json({
          items: buildPage(1, 20),
          total: 21,
          skip: 0,
          limit: 20,
        });
      })
    );

    const { user } = renderWithQueryClient(<ContractsPage />);

    const nextButton = await screen.findByRole("button", { name: "Próxima" });
    await waitFor(() => expect(nextButton).toBeEnabled());
    await user.click(nextButton);

    expect(await screen.findByText("Evento 21")).toBeVisible();
    expect(screen.getByText("Página 2 de 2 · 21 eventos no total")).toBeVisible();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
    expect(requestedSkips).toEqual([0, 20]);
  });
});
