import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatDate,
  getParticipantPaymentStatusLabel,
  getPaymentStatusLabel,
  getReadableMethod,
} from "@/lib/format";
import { ApiClientError, getErrorMessage } from "@/lib/get-error-message";

describe("textos de produção", () => {
  it("traduz estados de pagamento antes de exibi-los", () => {
    expect(getPaymentStatusLabel("pending")).toBe("Aguardando pagamento");
    expect(getPaymentStatusLabel("error")).toBe("Não concluído");
    expect(getParticipantPaymentStatusLabel("not_required")).toBe("Evento gratuito");
    expect(getParticipantPaymentStatusLabel("expired")).toBe("Pix expirado");
  });

  it("não exibe valores internos desconhecidos como rótulos", () => {
    expect(getReadableMethod("internal_provider_method")).toBe(
      "Outro meio de pagamento"
    );
    expect(formatDate("invalid-date")).toBe("—");
    expect(formatCurrency(Number.NaN)).toBe("—");
  });

  it("traduz códigos conhecidos e oculta detalhes técnicos", () => {
    expect(
      getErrorMessage(
        new ApiClientError("registration_already_exists", {
          status: 409,
          code: "registration_already_exists",
        })
      )
    ).toBe("Você já possui uma inscrição neste evento.");

    expect(
      getErrorMessage(
        new ApiClientError("event_invalid_timezone", {
          status: 422,
          code: "event_invalid_timezone",
        })
      )
    ).toBe("Informe um fuso horário válido para o evento.");

    expect(
      getErrorMessage(
        new ApiClientError(
          "Backend endpoint /payments failed with correlation ID abc-123",
          { status: 500 }
        ),
        "Não foi possível concluir o pagamento."
      )
    ).toBe("Não foi possível concluir o pagamento.");
  });
});
