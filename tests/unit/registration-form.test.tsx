import { http, HttpResponse, delay } from "msw";
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { RegistrationForm } from "@/components/public/registration-form";
import {
  buildRegistrationDetail,
  participantFixture,
  pendingPaymentFixture,
  pendingPublicPaymentFixture,
} from "@/tests/fixtures/participant";
import { server } from "@/tests/mocks/server";
import { routerMock } from "@/tests/setup/navigation-mock";
import { renderWithQueryClient } from "@/tests/setup/render";

const participantMeUrl =
  "*/api/backend/participant/participant-auth/me";
const createRegistrationUrl =
  "*/api/backend/participant/participant/contracts/10/registrations";
const registrationDetailUrl =
  "*/api/backend/participant/participant/registrations/42";
const createPixUrl =
  "*/api/backend/participant/participant/registrations/42/payments/pix";

describe("RegistrationForm", () => {
  it("mantém o evento visível e exige login para iniciar a inscrição", async () => {
    server.use(
      http.get(participantMeUrl, () =>
        HttpResponse.json(
          {
            detail: {
              code: "participant_authentication_required",
              message: "Autenticação de participante necessária.",
            },
          },
          { status: 401 }
        )
      )
    );

    const { user } = renderWithQueryClient(
      <RegistrationForm contractId={10} fields={[]} requiresPayment />
    );

    expect(await screen.findByText("Entre para se inscrever")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }));

    expect(routerMock.push).toHaveBeenCalledWith(
      "/participante/entrar?next=%2Feventos%2F10"
    );
  });

  it("cria uma única inscrição em clique duplo e exibe o Pix retornado", async () => {
    let registrationRequests = 0;
    let paymentRequests = 0;
    let paymentGenerated = false;
    const registration = buildRegistrationDetail();

    server.use(
      http.get(participantMeUrl, () => HttpResponse.json(participantFixture)),
      http.post(createRegistrationUrl, async () => {
        registrationRequests += 1;
        await delay(120);
        return HttpResponse.json(registration, { status: 201 });
      }),
      http.post(createPixUrl, () => {
        paymentRequests += 1;
        paymentGenerated = true;
        return HttpResponse.json(pendingPublicPaymentFixture, { status: 201 });
      }),
      http.get(registrationDetailUrl, () =>
        HttpResponse.json(
          buildRegistrationDetail({
            latest_payment: paymentGenerated ? pendingPaymentFixture : null,
          })
        )
      )
    );

    const { user } = renderWithQueryClient(
      <RegistrationForm contractId={10} fields={[]} requiresPayment />
    );

    await screen.findByText("Conta de participante");
    await user.type(screen.getByLabelText(/Nome completo/), "Participante A");

    await user.dblClick(
      screen.getByRole("button", { name: "Enviar inscrição e gerar Pix" })
    );

    expect(
      await screen.findByRole("img", { name: "QR Code para pagamento Pix" })
    ).toBeVisible();
    expect(screen.getByText(pendingPaymentFixture.copy_and_paste!)).toBeVisible();

    await waitFor(() => {
      expect(registrationRequests).toBe(1);
      expect(paymentRequests).toBe(1);
    });
  });

  it("trata 409 recuperando a inscrição existente sem criar outra cobrança", async () => {
    let registrationRequests = 0;
    let paymentRequests = 0;
    const existingRegistration = buildRegistrationDetail({
      latest_payment: pendingPaymentFixture,
    });

    server.use(
      http.get(participantMeUrl, () => HttpResponse.json(participantFixture)),
      http.post(createRegistrationUrl, () => {
        registrationRequests += 1;
        return HttpResponse.json(
          {
            detail: {
              code: "registration_already_exists",
              message: "Você já possui uma inscrição neste evento.",
              registration_id: 42,
              can_resume_payment: true,
            },
          },
          { status: 409 }
        );
      }),
      http.get(registrationDetailUrl, () =>
        HttpResponse.json(existingRegistration)
      ),
      http.post(createPixUrl, () => {
        paymentRequests += 1;
        return HttpResponse.json(pendingPublicPaymentFixture);
      })
    );

    const { user } = renderWithQueryClient(
      <RegistrationForm contractId={10} fields={[]} requiresPayment />
    );

    await screen.findByText("Conta de participante");
    await user.type(screen.getByLabelText(/Nome completo/), "Participante A");
    await user.click(
      screen.getByRole("button", { name: "Enviar inscrição e gerar Pix" })
    );

    expect(
      await screen.findByText("Você já está inscrito neste evento")
    ).toBeVisible();
    expect(await screen.findByText("Inscrição localizada")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "QR Code para pagamento Pix" })
    ).toBeVisible();
    expect(registrationRequests).toBe(1);
    expect(paymentRequests).toBe(0);
  });
  it("transforma o 409 de prazo encerrado em bloqueio do formulário", async () => {
    const onRegistrationClosed = vi.fn();

    server.use(
      http.get(participantMeUrl, () => HttpResponse.json(participantFixture)),
      http.post(createRegistrationUrl, () =>
        HttpResponse.json(
          {
            detail: {
              code: "event_registration_closed",
              message: "As inscrições para este evento estão encerradas.",
            },
          },
          { status: 409 }
        )
      )
    );

    const { user } = renderWithQueryClient(
      <RegistrationForm
        contractId={10}
        fields={[]}
        requiresPayment
        onRegistrationClosed={onRegistrationClosed}
      />
    );

    await screen.findByText("Conta de participante");
    await user.type(screen.getByLabelText(/Nome completo/), "Participante A");
    await user.click(
      screen.getByRole("button", { name: "Enviar inscrição e gerar Pix" })
    );

    await waitFor(() => {
      expect(onRegistrationClosed).toHaveBeenCalledWith({
        reason: "deadline_passed",
        message: "As inscrições para este evento estão encerradas.",
      });
    });
    expect(
      screen.queryByText("Não foi possível concluir a inscrição")
    ).not.toBeInTheDocument();
  });

});
