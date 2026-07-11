import { Suspense } from "react";
import Link from "next/link";

import { ParticipantLoginForm } from "@/components/forms/participant-login-form";
import { Container } from "@/components/layout/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getSafeNextPath } from "@/lib/safe-next-path";

type ParticipantLoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function ParticipantLoginPage({
  searchParams,
}: ParticipantLoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = getSafeNextPath(rawNext, "/");
  const registerHref = `/participante/cadastro?next=${encodeURIComponent(nextPath)}`;

  return (
    <section className="py-16">
      <Container className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Entrar como participante</CardTitle>
            <CardDescription>
              Use sua conta pessoal para realizar inscrições e acessar seus próprios eventos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<Spinner label="Carregando autenticação..." />}>
              <ParticipantLoginForm />
            </Suspense>

            <div className="text-center text-sm text-zinc-500">
              Ainda não possui conta?{" "}
              <Link
                className="font-medium text-zinc-900 hover:underline"
                href={registerHref}
              >
                Criar conta de participante
              </Link>
            </div>

            <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              Organiza eventos?{" "}
              <Link className="font-medium text-slate-900 hover:underline" href="/login">
                Entrar no painel do organizador
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
