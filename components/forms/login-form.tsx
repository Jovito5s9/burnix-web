"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/get-error-message";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggingIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wasRegistered = searchParams.get("registered") === "1";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await login({ email: email.trim(), password });
      router.push(searchParams.get("next") ?? "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar."));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {wasRegistered ? (
        <Alert variant="success" title="Conta criada com sucesso">
          Agora entre usando o E-mail e a senha cadastrados.
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" title="Não foi possível entrar">
          {error}
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <Button className="w-full" type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
