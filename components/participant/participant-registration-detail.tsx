"use client";

import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PaymentStatusPanel } from "@/components/participant/payment-status-panel";
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
import { Spinner } from "@/components/ui/spinner";
import { useParticipantRegistration } from "@/hooks/useParticipantRegistrations";
import {
  formatCurrency,
  formatDate,
  formatEventDateRange,
  getParticipantPaymentStatusLabel,
  getParticipantRegistrationStatusLabel,
} from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";

function formatExtraFieldLabel(key: string) {
  return key
    .replace(/[_.-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatExtraValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

type ParticipantRegistrationDetailProps = {
  id: string;
};

export function ParticipantRegistrationDetail({ id }: ParticipantRegistrationDetailProps) {
  const query = useParticipantRegistration(id);
  const registration = query.data;

  if (query.isLoading) {
    return (
      <section className="py-16">
        <Container>
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Carregando sua inscrição..." />
          </div>
        </Container>
      </section>
    );
  }

  if (query.error || !registration) {
    return (
      <section className="py-16">
        <Container className="max-w-3xl">
          <Alert variant="destructive" title="Não foi possível abrir esta inscrição">
            <div className="space-y-3">
              <p>
                {getErrorMessage(
                  query.error,
                  "A inscrição não foi encontrada ou não está disponível para esta conta."
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void query.refetch()}>
                  Tentar novamente
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/minhas-inscricoes">Voltar às inscrições</Link>
                </Button>
              </div>
            </div>
          </Alert>
        </Container>
      </section>
    );
  }

  const extraEntries = Object.entries(registration.extra_fields ?? {});

  return (
    <section className="py-10 sm:py-14">
      <Container className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/minhas-inscricoes">← Voltar para Minhas inscrições</Link>
          </Button>
        </div>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  registration.registration_status === "confirmed"
                    ? "success"
                    : registration.registration_status === "pending_payment"
                      ? "warning"
                      : "outline"
                }
              >
                {getParticipantRegistrationStatusLabel(registration.registration_status)}
              </Badge>
              <Badge
                variant={
                  registration.payment_status === "paid" ||
                  registration.payment_status === "not_required"
                    ? "success"
                    : registration.payment_status === "pending" ||
                        registration.payment_status === "expired" ||
                        registration.payment_status === "error"
                      ? "warning"
                      : "outline"
                }
              >
                Pagamento: {getParticipantPaymentStatusLabel(registration.payment_status)}
              </Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {registration.event.title}
              </h1>
              <p className="mt-2 text-slate-600">
                {formatEventDateRange(
                  registration.event.start_date,
                  registration.event.end_date
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:text-right">
            <p className="text-sm text-slate-500">Valor do evento</p>
            <p className="text-2xl font-semibold text-slate-950">
              {formatCurrency(
                Number(registration.event.price),
                registration.event.currency
              )}
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Dados da inscrição</CardTitle>
              <CardDescription>
                Informações vinculadas à sua conta e enviadas no formulário do evento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Nome</p>
                  <p className="break-words font-medium text-slate-950">{registration.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">E-mail</p>
                  <p className="break-words font-medium text-slate-950">{registration.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Telefone</p>
                  <p className="font-medium text-slate-950">{registration.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Documento</p>
                  <p className="font-medium text-slate-950">{registration.document ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Sexo</p>
                  <p className="font-medium text-slate-950">{registration.sex ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Idade</p>
                  <p className="font-medium text-slate-950">{registration.age ?? "—"}</p>
                </div>
              </div>

              {extraEntries.length > 0 ? (
                <div className="space-y-3 border-t border-slate-200 pt-5">
                  <h2 className="font-semibold text-slate-950">Informações adicionais</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {extraEntries.map(([key, value]) => (
                      <div key={key} className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="text-slate-500">{formatExtraFieldLabel(key)}</p>
                        <p className="mt-1 break-words font-medium text-slate-950">
                          {formatExtraValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:grid-cols-2">
                <p>Criada em {formatDate(registration.created_at)}</p>
                <p>Atualizada em {formatDate(registration.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          <PaymentStatusPanel
            registration={registration}
            isRefreshingStatus={query.isFetching}
          />
        </div>
      </Container>
    </section>
  );
}
