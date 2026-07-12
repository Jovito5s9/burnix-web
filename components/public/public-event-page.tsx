"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { RegistrationClosedState } from "@/components/public/registration-closed-state";
import { RegistrationForm } from "@/components/public/registration-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useEventAvailabilityTimer } from "@/hooks/useEventAvailabilityTimer";
import { usePublicContract } from "@/hooks/usePublicContract";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getContractStatusLabel,
} from "@/lib/format";
import type { RegistrationClosure } from "@/lib/event-availability";
import {
  ApiClientError,
  getApiErrorCode,
  getErrorMessage,
} from "@/lib/get-error-message";
import type { RegistrationAvailabilityState } from "@/types/public-contract";

type PublicEventPageProps = {
  id: string;
};

function isPublicEventNotFound(error: unknown) {
  return (
    (error instanceof ApiClientError && error.status === 404) ||
    getApiErrorCode(error) === "event_not_published" ||
    getApiErrorCode(error) === "event_not_found"
  );
}

function getClosedReason(
  state: RegistrationAvailabilityState
): Exclude<RegistrationAvailabilityState, "open"> {
  return state === "open" ? "deadline_passed" : state;
}

export function PublicEventPage({ id }: PublicEventPageProps) {
  const eventQuery = usePublicContract(id);
  const event = eventQuery.data ?? null;
  const [localClosureState, setLocalClosureState] = useState<{
    contractId: string;
    closure: RegistrationClosure;
  } | null>(null);

  const refetchEvent = eventQuery.refetch;
  const refreshAvailability = useCallback(() => {
    void refetchEvent();
  }, [refetchEvent]);

  const handleDeadlineReached = useCallback(() => {
    setLocalClosureState({
      contractId: id,
      closure: {
        reason: "deadline_passed",
        message: "As inscrições para este evento foram encerradas.",
      },
    });
    refreshAvailability();
  }, [id, refreshAvailability]);

  const { deadlineReached } = useEventAvailabilityTimer({
    registrationOpen: event?.registration_open ?? false,
    registrationDeadline: event?.registration_deadline ?? null,
    serverTime: event?.server_time ?? "1970-01-01T00:00:00Z",
    sampledAtMs: eventQuery.dataUpdatedAt,
    onDeadlineReached: handleDeadlineReached,
  });

  const handleRegistrationClosed = useCallback(
    (closure: RegistrationClosure) => {
      setLocalClosureState({ contractId: id, closure });
      refreshAvailability();
    },
    [id, refreshAvailability]
  );

  if (eventQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <Spinner label="Carregando evento público..." />
      </div>
    );
  }

  if (eventQuery.error) {
    if (isPublicEventNotFound(eventQuery.error)) {
      return (
        <section className="py-16">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
            <EmptyState
              title="Evento não encontrado"
              description="Este evento não está publicado ou o link informado não existe."
              action={
                <Button asChild>
                  <Link href="/">Voltar ao início</Link>
                </Button>
              }
            />
          </div>
        </section>
      );
    }

    return (
      <section className="py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" title="Erro ao carregar evento">
            <div className="space-y-3">
              <p>
                {getErrorMessage(
                  eventQuery.error,
                  "Não foi possível carregar o evento público."
                )}
              </p>
              <Button asChild variant="secondary">
                <Link href="/">Voltar ao início</Link>
              </Button>
            </div>
          </Alert>
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Evento não encontrado"
            description="Não encontramos um evento disponível neste endereço."
            action={
              <Button asChild>
                <Link href="/">Voltar ao início</Link>
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  const backendClosure: RegistrationClosure | null = event.registration_open
    ? null
    : {
        reason: getClosedReason(event.registration_state),
        message:
          event.registration_closed_message ??
          "As inscrições para este evento não estão disponíveis.",
      };
  const timerClosure: RegistrationClosure | null = deadlineReached
    ? {
        reason: "deadline_passed",
        message: "As inscrições para este evento foram encerradas.",
      }
    : null;
  const localClosure =
    localClosureState?.contractId === id ? localClosureState.closure : null;
  const activeClosure = localClosure ?? timerClosure ?? backendClosure;
  const registrationOpen = event.registration_open && !activeClosure;

  return (
    <section className="py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>Evento público</Badge>
                <Badge variant="outline">
                  {getContractStatusLabel(event.status)}
                </Badge>
              </div>
              <CardTitle className="text-3xl">{event.title}</CardTitle>
              <CardDescription>
                {event.description ?? "Evento sem descrição pública cadastrada."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Preço</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {formatCurrency(Number(event.price), event.currency)}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {event.currency}
                </p>
              </div>

              <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <p className="text-slate-500">Capacidade</p>
                  <p className="font-medium text-slate-950">
                    {formatNumber(event.capacity)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Vagas restantes</p>
                  <p className="font-medium text-slate-950">
                    {event.remaining_capacity === null
                      ? "Sem limite definido"
                      : formatNumber(event.remaining_capacity)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Prazo de inscrição</p>
                  <p className="font-medium text-slate-950">
                    {formatDate(event.registration_deadline)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Início</p>
                  <p className="font-medium text-slate-950">
                    {formatDate(event.start_at ?? event.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Fim</p>
                  <p className="font-medium text-slate-950">
                    {formatDate(event.end_at ?? event.end_date)}
                  </p>
                </div>
              </div>

              {registrationOpen ? (
                <Alert variant="info" title="Pronto para se inscrever?">
                  <p>
                    Você pode consultar este evento sem entrar. Para concluir a
                    inscrição, acesse sua conta de participante ou crie uma nova.
                  </p>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscrição</CardTitle>
            <CardDescription>
              {registrationOpen
                ? "Entre com sua conta de participante e preencha os dados solicitados pelo organizador."
                : "Consulte abaixo a situação atual das inscrições deste evento."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeClosure ? (
              <RegistrationClosedState
                reason={activeClosure.reason}
                message={activeClosure.message}
              />
            ) : (
              <RegistrationForm
                contractId={event.id}
                fields={event.form_fields ?? []}
                requiresPayment={Number(event.price) > 0}
                onRegistrationClosed={handleRegistrationClosed}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
