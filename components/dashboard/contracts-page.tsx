"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EventForm } from "@/components/forms/event-form";
import { StatusBadge } from "@/components/feedback/status-badge";
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
import { useContracts, useCreateContract } from "@/hooks/useContracts";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type { ContractCreatePayload, ContractUpdatePayload } from "@/types/contract";

const PAGE_SIZE = 20;

export function ContractsPage() {
  const [page, setPage] = useState(0);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const params = useMemo(
    () => ({ skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
    [page]
  );

  const { contracts, total, isLoading, isFetching, error, refetch } =
    useContracts(params);
  const createContractMutation = useCreateContract();

  async function handleCreateEvent(
    payload: ContractCreatePayload | ContractUpdatePayload
  ) {
    const created = await createContractMutation.mutateAsync(
      payload as ContractCreatePayload
    );
    setIsCreateFormOpen(false);
    setPage(0);
    setFeedback(
      created.status === "published"
        ? "Evento criado e publicado com sucesso."
        : "Evento criado como rascunho com sucesso."
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando eventos..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" title="Erro ao carregar eventos">
        <div className="space-y-3">
          <p>{getErrorMessage(error, "Não foi possível carregar os eventos.")}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </Alert>
    );
  }

  const hasPreviousPage = page > 0;
  const hasNextPage = contracts.length === PAGE_SIZE;

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Eventos</Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Lista de eventos
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Crie, publique e acompanhe todos os seus eventos.
              </p>
            </div>
            <Button
              onClick={() => {
                setFeedback(null);
                setIsCreateFormOpen((current) => !current);
              }}
            >
              {isCreateFormOpen ? "Fechar formulário" : "Criar evento"}
            </Button>
          </div>
        </div>

        {feedback ? (
          <div className="mb-6">
            <Alert variant="success" title="Eventos">
              <p>{feedback}</p>
            </Alert>
          </div>
        ) : null}

        {isCreateFormOpen ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Novo evento</CardTitle>
              <CardDescription>
                Preencha as informações e escolha entre salvar como rascunho ou publicar imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm
                mode="create"
                isSubmitting={createContractMutation.isPending}
                onSubmit={handleCreateEvent}
                onCancel={() => setIsCreateFormOpen(false)}
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Eventos cadastrados</CardTitle>
              <CardDescription>
                {total} eventos nesta página. Página {page + 1}. {isFetching ? "Atualizando..." : null}
              </CardDescription>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">Ir para a visão geral</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <EmptyState
                title="Nenhum evento encontrado"
                description="Crie o primeiro evento para começar a receber inscrições e pagamentos."
                action={
                  <Button variant="secondary" onClick={() => setIsCreateFormOpen(true)}>
                    Criar evento
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4">
                {contracts.map((contract) => (
                  <article
                    key={contract.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-950">
                            {contract.title}
                          </h3>
                          <StatusBadge kind="contract" status={contract.status} />
                        </div>
                        <p className="text-sm text-slate-600">
                          {contract.description ?? "Sem descrição cadastrada."}
                        </p>
                        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                          <span>Capacidade: {formatNumber(contract.capacity)}</span>
                          <span>Início: {formatDate(contract.start_at ?? contract.start_date)}</span>
                          <span>Fim: {formatDate(contract.end_at ?? contract.end_date)}</span>
                          <span>Prazo: {formatDate(contract.registration_deadline)}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Versão {contract.version} · atualizado em {formatDate(contract.updated_at)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 text-left lg:text-right">
                        <span className="text-xl font-semibold text-slate-950">
                          {formatCurrency(Number(contract.price), contract.currency)}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          {contract.currency}
                        </span>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/contracts/${contract.id}`}>Abrir detalhe</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Página {page + 1}{total > 0 ? ` · ${total} eventos` : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
