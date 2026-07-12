import { Suspense } from "react";
import Link from "next/link";

import { ParticipantRegisterForm } from "@/components/forms/participant-register-form";
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

type ParticipantRegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function ParticipantRegisterPage({
  searchParams,
}: ParticipantRegisterPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = getSafeNextPath(rawNext, "/");
  const loginHref = `/participante/entrar?next=${encodeURIComponent(nextPath)}`;

  return (
    <section className="py-16">
      <Container className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Criar conta de participante</CardTitle>
            <CardDescription>
              Use esta conta para fazer inscrições e acompanhar seus pagamentos com segurança.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<Spinner label="Carregando cadastro..." />}>
              <ParticipantRegisterForm />
            </Suspense>

            <div className="text-center text-sm text-zinc-500">
              Já possui conta?{" "}
              <Link
                className="font-medium text-zinc-900 hover:underline"
                href={loginHref}
              >
                Entrar como participante
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
