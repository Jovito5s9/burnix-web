"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimitCountdown } from "@/hooks/useRateLimitCountdown";
import { getErrorMessage } from "@/lib/get-error-message";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isRegistering } = useAuth();
  const rateLimit = useRateLimitCountdown();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rateLimit.isRateLimited) return;

    setError(null);

    const email = formData.email.trim();
    const password = formData.password;

    if (password.length < 8 || password.length > 256) {
      setError("A senha precisa ter entre 8 e 256 caracteres.");
      return;
    }

    try {
      await register({ email, password });

      const loginUrl = new URL("/login", window.location.origin);
      const nextUrl = searchParams.get("next");

      loginUrl.searchParams.set("registered", "1");

      if (nextUrl) {
        loginUrl.searchParams.set("next", nextUrl);
      }

      router.push(`${loginUrl.pathname}${loginUrl.search}`);
    } catch (registerError) {
      if (rateLimit.startFromError(registerError)) return;
      setError(
        getErrorMessage(registerError, "Não foi possível criar a conta.")
      );
    }
  }

  const isSubmitDisabled = isRegistering || rateLimit.isRateLimited;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {rateLimit.message ? (
        <Alert variant="warning" title="Aguarde para tentar novamente" aria-live="polite">
          {rateLimit.message}
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" title="Falha no cadastro">
          {error}
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={formData.email}
          onChange={(event) => updateField("email", event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Crie uma senha com pelo menos 8 caracteres"
          value={formData.password}
          onChange={(event) => updateField("password", event.target.value)}
          minLength={8}
          maxLength={256}
          required
        />
      </div>

      <Button className="w-full" type="submit" disabled={isSubmitDisabled}>
        {isRegistering
          ? "Criando conta..."
          : rateLimit.isRateLimited
            ? `Tente novamente em ${rateLimit.secondsRemaining}s`
            : "Criar conta"}
      </Button>
    </form>
  );
}
