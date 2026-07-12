import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PixPaymentBox } from "@/components/public/pix-payment-box";
import { ApiClientError } from "@/lib/get-error-message";
import {
  buildRegistrationDetail,
  pendingPaymentFixture,
} from "@/tests/fixtures/participant";

describe("PixPaymentBox", () => {
  it("exibe QR Code, código copia e cola e checkout para pagamento pendente", () => {
    render(
      <PixPaymentBox
        registration={buildRegistrationDetail({
          latest_payment: pendingPaymentFixture,
        })}
      />
    );

    expect(
      screen.getByRole("img", { name: "QR Code para pagamento Pix" })
    ).toBeVisible();
    expect(screen.getByText(pendingPaymentFixture.copy_and_paste!)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Concluir pagamento" })
    ).toHaveAttribute("href", pendingPaymentFixture.checkout_url);
  });

  it("atualiza a apresentação quando o pagamento está confirmado", () => {
    render(
      <PixPaymentBox
        registration={buildRegistrationDetail({
          registration_status: "confirmed",
          payment_status: "paid",
          latest_payment: {
            ...pendingPaymentFixture,
            status: "paid",
            checkout_url: null,
            qr_code_base64: null,
            copy_and_paste: null,
          },
        })}
      />
    );

    expect(screen.getAllByText("Pagamento confirmado")).toHaveLength(2);
    expect(
      screen.queryByRole("img", { name: "QR Code para pagamento Pix" })
    ).not.toBeInTheDocument();
  });

  it("oferece nova tentativa quando o Pix expirou", async () => {
    const onGeneratePix = vi.fn();
    const user = userEvent.setup();

    render(
      <PixPaymentBox
        registration={buildRegistrationDetail({
          registration_status: "expired",
          payment_status: "expired",
          latest_payment: {
            ...pendingPaymentFixture,
            status: "expired",
          },
        })}
        onGeneratePix={onGeneratePix}
      />
    );

    expect(
      screen.getAllByText("Este Pix expirou")
    ).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: "Gerar novo Pix" })
    );

    expect(onGeneratePix).toHaveBeenCalledTimes(1);
  });

  it("não mostra QR Code em evento gratuito", () => {
    render(
      <PixPaymentBox
        registration={buildRegistrationDetail({
          registration_status: "confirmed",
          payment_status: "not_required",
          latest_payment: null,
        })}
        result={{
          registration_id: 42,
          status: "not_required",
          message: "Este evento é gratuito e não exige pagamento.",
        }}
      />
    );

    expect(screen.getAllByText("Este evento é gratuito")).toHaveLength(1);
    expect(
      screen.queryByRole("img", { name: "QR Code para pagamento Pix" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Gerar Pix|Gerar novo Pix/ })
    ).not.toBeInTheDocument();
  });
  it("desabilita a geração de Pix durante o Retry-After", async () => {
    render(
      <PixPaymentBox
        registration={buildRegistrationDetail({
          payment_status: "pending",
          latest_payment: null,
        })}
        generationError={
          new ApiClientError("rate limit", {
            status: 429,
            retryAfterSeconds: 45,
          })
        }
        onGeneratePix={vi.fn()}
      />
    );

    expect(
      await screen.findByText(
        "Muitas tentativas foram realizadas. Aguarde 45 segundos e tente novamente."
      )
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Tente novamente em 45s" })
    ).toBeDisabled();
  });

});
