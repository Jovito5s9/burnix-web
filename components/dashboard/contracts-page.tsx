"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useContracts } from "@/hooks/useContracts";
import { formatCurrency, formatDate } from "@/lib/format";

export function ContractsPage() {
  const { contracts, total, isLoading, error, refetch } = useContracts();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando contratos..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" title="Erro ao carregar contratos">
        <div className="space-y-3">
          <p>{error.message}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Contratos</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Lista de contratos</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Todos os contratos cadastrados na plataforma.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Contratos cadastrados</CardTitle>
              <CardDescription>{total} contratos encontrados.</CardDescription>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">Ir ao dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <EmptyState
                title="Nenhum contrato encontrado"
                description="O frontend já está pronto para exibir a listagem assim que a API retornar dados."
                action={
                  <Button asChild>
                    <Link href="/dashboard">Voltar ao dashboard</Link>
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
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-950">{contract.title}</h3>
                          <StatusBadge kind="contract" status={contract.status} />
                        </div>
                        <p className="text-sm text-slate-600">{contract.description}</p>
                        <p className="text-xs text-slate-500">Criado em {formatDate(contract.created_at)}</p>
                      </div>

                      <div className="flex flex-col gap-2 text-left lg:text-right">
                        <span className="text-xl font-semibold text-slate-950">{formatCurrency(Number(contract.price))}</span>
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
