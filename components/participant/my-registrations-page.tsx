"use client";

import Link from "next/link";

import { Container } from "@/components/layout/container";
import { RegistrationCard } from "@/components/participant/registration-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useParticipantRegistrations } from "@/hooks/useParticipantRegistrations";
import { getErrorMessage } from "@/lib/get-error-message";

export function MyRegistrationsPage() {
  const { registrations, isLoading, isFetching, error, refetch } =
    useParticipantRegistrations();

  if (isLoading) {
    return (
      <section className="py-16">
        <Container>
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Carregando suas inscrições..." />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-14">
      <Container className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary">Área do participante</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Minhas inscrições
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Consulte os eventos em que você se inscreveu, acompanhe a confirmação
              e conclua pagamentos pendentes.
            </p>
          </div>
          {registrations.length > 0 ? (
            <p className="text-sm text-slate-500">
              {registrations.length} {registrations.length === 1 ? "inscrição" : "inscrições"}
              {isFetching ? " · Atualizando..." : ""}
            </p>
          ) : null}
        </header>

        {error ? (
          <Alert variant="destructive" title="Não foi possível carregar suas inscrições">
            <div className="space-y-3">
              <p>
                {getErrorMessage(
                  error,
                  "Não foi possível carregar suas inscrições. Tente novamente."
                )}
              </p>
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            </div>
          </Alert>
        ) : null}

        {!error && registrations.length === 0 ? (
          <EmptyState
            title="Você ainda não se inscreveu em nenhum evento."
            description="Quando você concluir uma inscrição, ela aparecerá aqui com o status e as opções de pagamento."
            action={
              <Button asChild variant="secondary">
                <Link href="/">Voltar ao início</Link>
              </Button>
            }
          />
        ) : null}

        {!error && registrations.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {registrations.map((registration) => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
