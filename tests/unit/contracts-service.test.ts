import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/services/api", () => ({ api: apiMock }));

import {
  createContract,
  listContracts,
  runContractStatusAction,
  updateContract,
} from "@/services/contracts";

describe("serviço de eventos", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    apiMock.patch.mockReset();
    apiMock.delete.mockReset();
  });

  it("usa a URL canônica da coleção sem barra final", async () => {
    apiMock.get.mockResolvedValue({ data: [] });
    apiMock.post.mockResolvedValue({ data: { id: 10 } });

    await listContracts({ skip: 0, limit: 50 });
    await createContract({ title: "Evento", status: "draft" });

    expect(apiMock.get).toHaveBeenCalledWith("/contracts", {
      params: { skip: 0, limit: 50 },
    });
    expect(apiMock.post).toHaveBeenCalledWith("/contracts", {
      title: "Evento",
      status: "draft",
    });
  });

  it("envia version na atualização otimista", async () => {
    apiMock.patch.mockResolvedValue({ data: { id: 10, version: 5 } });

    await updateContract(10, { version: 4, title: "Título atualizado" });

    expect(apiMock.patch).toHaveBeenCalledWith("/contracts/10", {
      version: 4,
      title: "Título atualizado",
    });
  });

  it.each(["publish", "close", "cancel", "reopen"] as const)(
    "usa o endpoint explícito da ação %s",
    async (action) => {
      apiMock.post.mockResolvedValue({ data: { id: 10 } });

      await runContractStatusAction(10, action, { version: 7 });

      expect(apiMock.post).toHaveBeenCalledWith(`/contracts/10/${action}`, {
        version: 7,
      });
    }
  );
});
