import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { LoginForm } from "@/components/forms/login-form";
import { server } from "@/tests/mocks/server";
import { renderWithQueryClient } from "@/tests/setup/render";

const organizerMeUrl = "*/api/backend/organizer/auth/me";
const organizerLoginUrl = "*/api/session/organizer/login";

describe("LoginForm com rate limit", () => {
  it("preserva E-mail e senha e bloqueia temporariamente uma nova tentativa", async () => {
    server.use(
      http.get(organizerMeUrl, () =>
        HttpResponse.json(
          {
            detail: {
              code: "authentication_required",
              message: "Autenticação necessária.",
            },
          },
          { status: 401 }
        )
      ),
      http.post(organizerLoginUrl, () =>
        HttpResponse.json(
          {
            detail: {
              code: "rate_limit_exceeded",
              message: "Muitas tentativas.",
              retry_after_seconds: 45,
            },
          },
          {
            status: 429,
            headers: { "Retry-After": "45" },
          }
        )
      )
    );

    const { user } = renderWithQueryClient(<LoginForm />);
    const email = screen.getByLabelText("E-mail");
    const password = screen.getByLabelText("Senha");

    await user.type(email, "organizador@example.com");
    await user.type(password, "senha-segura");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText(
        "Muitas tentativas foram realizadas. Aguarde 45 segundos e tente novamente."
      )
    ).toBeVisible();
    expect(email).toHaveValue("organizador@example.com");
    expect(password).toHaveValue("senha-segura");
    expect(
      screen.getByRole("button", { name: "Tente novamente em 45s" })
    ).toBeDisabled();
  });
});
