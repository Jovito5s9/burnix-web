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
import { usePayments } from "@/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/format";

export function PaymentsPage() {
  const paymentsQuery = usePayments();
  const contractsQuery = useContracts();

  if (paymentsQuery.isLoading || contractsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando pagamentos..." />
      </div>
    );
  }

  if (paymentsQuery.error || contractsQuery.error) {
    const message =
      paymentsQuery.error?.message ?? contractsQuery.error?.message ?? "Não foi possível carregar os pagamentos.";

    return (
      <Alert variant="destructive" title="Erro ao carregar pagamentos">
        <div className="space-y-3">
          <p>{message}</p>
          <Button asChild variant="secondary">
            <Link href="/payments">Tentar novamente</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  const contractMap = new Map(contractsQuery.contracts.map((contract) => [contract.id, contract]));

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Pagamentos</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Histórico de pagamentos</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Veja status, valores e vínculo com contratos para acompanhar o fluxo financeiro.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Pagamentos registrados</CardTitle>
              <CardDescription>{paymentsQuery.total} eventos carregados da API.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/contracts">Ver contratos</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">Ir ao dashboard</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paymentsQuery.payments.length === 0 ? (
              <EmptyState
                title="Nenhum pagamento encontrado"
                description="Assim que o backend devolver cobranças, elas aparecerão aqui."
                action={
                  <Button asChild>
                    <Link href="/contracts">Ir para contratos</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4">
                {paymentsQuery.payments.map((payment) => {
                  const contract = contractMap.get(payment.contractId);

                  return (
                    <article
                      key={payment.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-950">{formatCurrency(payment.amount)}</h3>
                            <StatusBadge kind="payment" status={payment.status} />
                          </div>
                          <p className="text-sm text-slate-600">
                            Contrato {contract?.customerName ?? payment.contractId}
                            {contract?.planName ? ` · ${contract.planName}` : ""}
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(payment.createdAt)}</p>
                        </div>

                        <div className="flex flex-col gap-2 text-left lg:text-right">
                          <p className="text-sm text-slate-500">
                            Método: <span className="font-medium text-slate-950">{payment.method ? payment.method.toUpperCase() : "—"}</span>
                          </p>
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/contracts/${payment.contractId}`}>Abrir contrato</Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
