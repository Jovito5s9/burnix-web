"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/get-error-message";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isRegistering } = useAuth();

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
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar a conta."));
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
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
          placeholder="Crie uma senha com pelo menos 8 caracteres"
          value={formData.password}
          onChange={(event) => updateField("password", event.target.value)}
          minLength={8}
          maxLength={256}
          required
        />
      </div>

      <Button className="w-full" type="submit" disabled={isRegistering}>
        {isRegistering ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
