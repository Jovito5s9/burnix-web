"use client";

import Link from "next/link";

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
import { usePublicContract } from "@/hooks/usePublicContract";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getContractStatusLabel,
} from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";

type PublicEventPageProps = {
  id: string;
};

export function PublicEventPage({ id }: PublicEventPageProps) {
  const eventQuery = usePublicContract(id);
  const event = eventQuery.data ?? null;

  if (eventQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <Spinner label="Carregando evento público..." />
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <section className="py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" title="Erro ao carregar evento">
            <div className="space-y-3">
              <p>{getErrorMessage(eventQuery.error, "Não foi possível carregar o evento público.")}</p>
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
            description="O link informado não retornou nenhum evento público."
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
    <section className="py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>Evento público</Badge>
                <Badge variant="outline">{getContractStatusLabel(event.status)}</Badge>
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
                  <p className="text-slate-500">Prazo de inscrição</p>
                  <p className="font-medium text-slate-950">
                    {formatDate(event.registration_deadline)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Início</p>
                  <p className="font-medium text-slate-950">
                    {formatDate(event.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Fim</p>
                  <p className="font-medium text-slate-950">
                    {formatDate(event.end_date)}
                  </p>
                </div>
              </div>

              <Alert variant="info" title="Pagamento">
                <p>
                  Após enviar a inscrição, o frontend chama o Pix público da inscrição e mostra QR Code, copia e cola ou link de pagamento OpenPix quando retornados pelo backend.
                </p>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscrição</CardTitle>
            <CardDescription>
              Preencha os dados do participante. Os campos adicionais são definidos pelo organizador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationForm contractId={event.id} fields={event.form_fields ?? []} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
