"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useContracts, useCreateContract } from "@/hooks/useContracts";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type { ContractCreatePayload, ContractStatus } from "@/types/contract";

const PAGE_SIZE = 20;

function toNullableIsoDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function getNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getNullableNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ContractsPage() {
  const [page, setPage] = useState(0);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const params = useMemo(
    () => ({ skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
    [page]
  );

  const { contracts, total, isLoading, isFetching, error, refetch } = useContracts(params);
  const createContractMutation = useCreateContract();

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const formData = new FormData(event.currentTarget);
    const title = getNullableString(formData.get("title"));
    const price = getNullableString(formData.get("price")) ?? "0.00";
    const status = (getNullableString(formData.get("status")) ?? "draft") as ContractStatus;

    if (!title) {
      setFeedback("Informe um título para criar o evento.");
      return;
    }

    const payload: ContractCreatePayload = {
      title,
      description: getNullableString(formData.get("description")),
      status,
      price,
      currency: getNullableString(formData.get("currency")) ?? "BRL",
      capacity: getNullableNumber(formData.get("capacity")),
      start_date: toNullableIsoDate(formData.get("start_date")),
      end_date: toNullableIsoDate(formData.get("end_date")),
      registration_deadline: toNullableIsoDate(formData.get("registration_deadline")),
      payment_config: null,
    };

    try {
      await createContractMutation.mutateAsync(payload);
      event.currentTarget.reset();
      setIsCreateFormOpen(false);
      setPage(0);
      setFeedback("Evento criado com sucesso.");
    } catch (err) {
      setFeedback(getErrorMessage(err, "Não foi possível criar o evento."));
    }
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
          <p>{error.message}</p>
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
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Lista de eventos</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Gerencie os eventos cadastrados no backend Burnix. A rota do backend continua sendo `/contracts/`, mas a interface usa a linguagem de eventos.
              </p>
            </div>
            <Button onClick={() => setIsCreateFormOpen((current) => !current)}>
              {isCreateFormOpen ? "Fechar formulário" : "Criar evento"}
            </Button>
          </div>
        </div>

        {feedback ? (
          <div className="mb-6">
            <Alert
              variant={feedback.includes("sucesso") ? "success" : "warning"}
              title="Eventos"
            >
              <p>{feedback}</p>
            </Alert>
          </div>
        ) : null}

        {isCreateFormOpen ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Novo evento</CardTitle>
              <CardDescription>
                Crie um evento usando o contrato atual de `POST /contracts/`.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateEvent}>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" placeholder="Nome do evento" required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    placeholder="Descrição pública ou interna do evento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue="draft"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="closed">Encerrado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade</Label>
                  <Input id="capacity" name="capacity" type="number" min="0" placeholder="Ex.: 100" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço</Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue="0.00" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Input id="currency" name="currency" defaultValue="BRL" maxLength={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Início</Label>
                  <Input id="start_date" name="start_date" type="datetime-local" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Fim</Label>
                  <Input id="end_date" name="end_date" type="datetime-local" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="registration_deadline">Prazo de inscrição</Label>
                  <Input id="registration_deadline" name="registration_deadline" type="datetime-local" />
                </div>

                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <Button type="submit" disabled={createContractMutation.isPending}>
                    {createContractMutation.isPending ? "Criando..." : "Criar evento"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreateFormOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
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
              <Link href="/dashboard">Ir ao dashboard</Link>
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
                          <h3 className="text-lg font-semibold text-slate-950">{contract.title}</h3>
                          <StatusBadge kind="contract" status={contract.status} />
                        </div>
                        <p className="text-sm text-slate-600">
                          {contract.description ?? "Sem descrição cadastrada."}
                        </p>
                        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                          <span>Capacidade: {formatNumber(contract.capacity)}</span>
                          <span>Início: {formatDate(contract.start_date)}</span>
                          <span>Fim: {formatDate(contract.end_date)}</span>
                          <span>Prazo: {formatDate(contract.registration_deadline)}</span>
                        </div>
                        <p className="text-xs text-slate-500">Criado em {formatDate(contract.created_at)}</p>
                      </div>

                      <div className="flex flex-col gap-2 text-left lg:text-right">
                        <span className="text-xl font-semibold text-slate-950">
                          {formatCurrency(Number(contract.price), contract.currency)}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-500">{contract.currency}</span>
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
                Usando paginação por `skip` e `limit`: skip {params.skip}, limit {params.limit}.
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
