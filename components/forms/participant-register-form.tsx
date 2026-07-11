"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import { getErrorMessage } from "@/lib/get-error-message";
import { getSafeNextPath } from "@/lib/safe-next-path";

export function ParticipantRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isRegistering } = useParticipantAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8 || password.length > 256) {
      setError("A senha precisa ter entre 8 e 256 caracteres.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("A confirmação de senha não corresponde à senha informada.");
      return;
    }

    try {
      await register({ email: email.trim(), password });
      router.replace(getSafeNextPath(searchParams.get("next"), "/"));
      router.refresh();
    } catch (registerError) {
      setError(getErrorMessage(registerError, "Não foi possível criar a conta de participante."));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive" title="Falha no cadastro">
          {error}
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="participant-register-email">E-mail</Label>
        <Input
          id="participant-register-email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="participant-register-password">Senha</Label>
        <Input
          id="participant-register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Crie uma senha com pelo menos 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          maxLength={256}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="participant-register-password-confirmation">
          Confirmar senha
        </Label>
        <Input
          id="participant-register-password-confirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          minLength={8}
          maxLength={256}
          required
        />
      </div>

      <Button className="w-full" type="submit" disabled={isRegistering}>
        {isRegistering ? "Criando conta..." : "Criar conta de participante"}
      </Button>
    </form>
  );
}
