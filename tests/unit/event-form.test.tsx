import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventForm } from "@/components/forms/event-form";
import { ApiClientError } from "@/lib/get-error-message";
import { renderWithQueryClient } from "@/tests/setup/render";
import type { Contract } from "@/types/contract";

const contract: Contract = {
  id: 10,
  owner_user_id: 3,
  client_id: null,
  title: "Evento original",
  description: "Descrição original",
  status: "published",
  version: 4,
  price: "50.00",
  currency: "BRL",
  capacity: 100,
  start_date: "2026-10-10",
  end_date: "2026-10-10",
  start_at: "2026-10-10T10:00:00Z",
  end_at: "2026-10-10T15:00:00Z",
  timezone: "America/Belem",
  registration_deadline: "2026-10-10T02:59:59Z",
  payment_config: null,
  published_at: "2026-07-12T18:00:00Z",
  closed_at: null,
  cancelled_at: null,
  created_at: "2026-07-12T17:00:00Z",
  updated_at: "2026-07-12T18:00:00Z",
};

describe("EventForm", () => {
  it("cria evento usando timestamps precisos e timezone", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithQueryClient(
      <EventForm mode="create" onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Título"), "Corrida Burnix");
    await user.selectOptions(screen.getByLabelText("Situação inicial"), "published");
    fireEvent.change(screen.getByLabelText("Início"), {
      target: { value: "2026-10-10T07:00" },
    });
    fireEvent.change(screen.getByLabelText("Fim"), {
      target: { value: "2026-10-10T12:00" },
    });
    fireEvent.change(screen.getByLabelText("Prazo de inscrição"), {
      target: { value: "2026-10-09T23:59" },
    });

    await user.click(screen.getByRole("button", { name: "Criar evento" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Corrida Burnix",
        status: "published",
        start_at: "2026-10-10T07:00:00",
        end_at: "2026-10-10T12:00:00",
        registration_deadline: "2026-10-09T23:59:00",
        timezone: "America/Belem",
        currency: "BRL",
      })
    );
  });

  it("envia version na edição e omite preço e moeda quando estão bloqueados", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithQueryClient(
      <EventForm
        mode="edit"
        contract={contract}
        financialLocked
        onSubmit={onSubmit}
      />
    );

    const title = screen.getByLabelText("Título");
    await user.clear(title);
    await user.type(title, "Evento atualizado");

    expect(screen.getByLabelText("Preço")).toBeDisabled();
    expect(screen.getByLabelText("Moeda")).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      version: 4,
      title: "Evento atualizado",
      timezone: "America/Belem",
    });
    expect(payload).not.toHaveProperty("price");
    expect(payload).not.toHaveProperty("currency");
  });

  it("recarrega os dados quando o backend informa conflito de versão", async () => {
    const onVersionConflict = vi.fn().mockResolvedValue(undefined);
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiClientError("Conflito de versão", {
        status: 409,
        code: "event_version_conflict",
      })
    );
    const { user } = renderWithQueryClient(
      <EventForm
        mode="edit"
        contract={contract}
        onSubmit={onSubmit}
        onVersionConflict={onVersionConflict}
      />
    );

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(onVersionConflict).toHaveBeenCalledTimes(1));
    expect(
      screen.getByText(/evento foi alterado em outra sessão/i)
    ).toBeInTheDocument();
  });
});
