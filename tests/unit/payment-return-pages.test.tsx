import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FailurePage from "@/app/falha/page";
import PendingPage from "@/app/pendente/page";
import SuccessPage from "@/app/sucesso/page";

type ReturnPage = typeof SuccessPage;

const pages: Array<{
  name: string;
  Page: ReturnPage;
  title: string;
}> = [
  { name: "sucesso", Page: SuccessPage, title: "Pagamento enviado" },
  {
    name: "falha",
    Page: FailurePage,
    title: "Não foi possível concluir o pagamento",
  },
  { name: "pendente", Page: PendingPage, title: "Aguardando pagamento" },
];

describe("páginas de retorno do pagamento", () => {
  it.each(pages)(
    "$name direciona um registration_id válido para a inscrição sem expor parâmetros técnicos",
    async ({ Page, title }) => {
      const ui = await Page({
        searchParams: Promise.resolve({
          registration_id: "42",
          payment_id: "987",
          correlation_id: "internal-correlation-id",
          checkout_id: "gateway-checkout-id",
        }),
      });

      render(ui);

      expect(screen.getByText(title)).toBeVisible();
      expect(
        screen.getByRole("link", { name: /Ver minha inscrição|Acompanhar minha inscrição/ })
      ).toHaveAttribute("href", "/minhas-inscricoes/42");
      expect(screen.getByRole("link", { name: "Minhas inscrições" })).toHaveAttribute(
        "href",
        "/minhas-inscricoes"
      );
      expect(screen.queryByText("987")).not.toBeInTheDocument();
      expect(screen.queryByText("internal-correlation-id")).not.toBeInTheDocument();
      expect(screen.queryByText("gateway-checkout-id")).not.toBeInTheDocument();
    }
  );

  it.each(pages)("$name ignora registration_id inválido", async ({ Page }) => {
    const ui = await Page({
      searchParams: Promise.resolve({ registration_id: "../admin" }),
    });

    render(ui);

    expect(
      screen.queryByRole("link", { name: /Ver minha inscrição|Acompanhar minha inscrição/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Minhas inscrições" })).toHaveAttribute(
      "href",
      "/minhas-inscricoes"
    );
  });
});
