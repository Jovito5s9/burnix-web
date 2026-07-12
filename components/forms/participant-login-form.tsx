"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import { useRateLimitCountdown } from "@/hooks/useRateLimitCountdown";
import { getErrorMessage } from "@/lib/get-error-message";
import { getSafeNextPath } from "@/lib/safe-next-path";

export function ParticipantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggingIn } = useParticipantAuth();
  const rateLimit = useRateLimitCountdown();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wasRegistered = searchParams.get("registered") === "1";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rateLimit.isRateLimited) return;

    setError(null);

    try {
      await login({ email: email.trim(), password });
      router.replace(getSafeNextPath(searchParams.get("next"), "/"));
      router.refresh();
    } catch (loginError) {
      if (rateLimit.startFromError(loginError)) return;
      setError(
        getErrorMessage(
          loginError,
          "Não foi possível entrar como participante."
        )
      );
    }
  }

  const isSubmitDisabled = isLoggingIn || rateLimit.isRateLimited;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {wasRegistered ? (
        <Alert variant="success" title="Conta criada com sucesso">
          Entre com o E-mail e a senha cadastrados.
        </Alert>
      ) : null}

      {rateLimit.message ? (
        <Alert variant="warning" title="Aguarde para tentar novamente" aria-live="polite">
          {rateLimit.message}
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" title="Não foi possível entrar">
          {error}
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="participant-email">E-mail</Label>
        <Input
          id="participant-email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="participant-password">Senha</Label>
        <Input
          id="participant-password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <Button className="w-full" type="submit" disabled={isSubmitDisabled}>
        {isLoggingIn
          ? "Entrando..."
          : rateLimit.isRateLimited
            ? `Tente novamente em ${rateLimit.secondsRemaining}s`
            : "Entrar como participante"}
      </Button>
    </form>
  );
}
