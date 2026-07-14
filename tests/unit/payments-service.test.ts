import { beforeEach, describe, expect, it, vi } from "vitest";

const participantApiMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/services/participant-api", () => ({
  participantApi: participantApiMock,
}));

import { createParticipantRegistrationPixPayment } from "@/services/payments";
import { pendingPublicPaymentFixture } from "@/tests/fixtures/participant";

describe("serviço de pagamento do participante", () => {
  beforeEach(() => {
    participantApiMock.post.mockReset();
  });

  it("gera o Pix pela rota autenticada da inscrição e preserva a idempotência", async () => {
    participantApiMock.post.mockResolvedValue({
      data: pendingPublicPaymentFixture,
    });

    await expect(
      createParticipantRegistrationPixPayment(42, {
        idempotency_key: "pix-registration-42-attempt-1",
      })
    ).resolves.toEqual(pendingPublicPaymentFixture);

    expect(participantApiMock.post).toHaveBeenCalledWith(
      "/participant/registrations/42/payments/pix",
      { idempotency_key: "pix-registration-42-attempt-1" }
    );
  });
});
