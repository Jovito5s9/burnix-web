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

export function DashboardOverview() {
  const contractsQuery = useContracts();
  const paymentsQuery = usePayments();

  if (contractsQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando visão geral..." />
      </div>
    );
  }

  if (contractsQuery.error || paymentsQuery.error) {
    const message =
      contractsQuery.error?.message ??
      paymentsQuery.error?.message ??
      "Não foi possível carregar o dashboard.";

    return (
      <Alert variant="destructive" title="Erro ao carregar o dashboard">
        <div className="space-y-3">
          <p>{message}</p>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Tentar novamente</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  const activeContracts = contractsQuery.contracts.filter((contract) => contract.status === "active").length;
  const pendingPayments = paymentsQuery.payments.filter((payment) => payment.status === "pending").length;
  const paidPayments = paymentsQuery.payments.filter((payment) => payment.status === "paid").length;
  const totalRevenue = paymentsQuery.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const recentContracts = contractsQuery.contracts.slice(0, 3);
  const recentPayments = paymentsQuery.payments.slice(0, 3);

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Dashboard</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Visão geral</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Acompanhe contratos, pagamentos e os próximos passos do fluxo SaaS.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Contratos totais</CardDescription>
              <CardTitle>{contractsQuery.total}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {activeContracts} contratos ativos agora.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Pagamentos pagos</CardDescription>
              <CardTitle>{paidPayments}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {pendingPayments} pagamentos ainda pendentes.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Receita confirmada</CardDescription>
              <CardTitle>{formatCurrency(totalRevenue)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Base para acompanhar faturamento e conversão.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Checkout em aberto</CardDescription>
              <CardTitle>{pendingPayments}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Fluxos em aberto aguardando confirmação.
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Contratos recentes</CardTitle>
                <CardDescription>Últimos contratos carregados pela API.</CardDescription>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/contracts">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentContracts.length === 0 ? (
                <EmptyState
                  title="Nenhum contrato disponível"
                  description="Quando a API responder, os contratos aparecerão aqui."
                />
              ) : (
                <div className="space-y-3">
                  {recentContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div>
                        <p className="font-medium text-slate-950">{contract.customerName}</p>
                        <p className="text-sm text-slate-500">{contract.planName}</p>
                        <p className="mt-1 text-xs text-slate-500">Criado em {formatDate(contract.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge kind="contract" status={contract.status} />
                        <span className="text-sm font-semibold text-slate-950">{formatCurrency(contract.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Pagamentos recentes</CardTitle>
                <CardDescription>Eventos financeiros mais recentes.</CardDescription>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/payments">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <EmptyState
                  title="Nenhum pagamento disponível"
                  description="Assim que houver cobranças na API, elas aparecerão aqui."
                />
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div>
                        <p className="font-medium text-slate-950">Contrato {payment.contractId}</p>
                        <p className="text-sm text-slate-500">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge kind="payment" status={payment.status} />
                        <span className="text-sm font-semibold text-slate-950">{formatCurrency(payment.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
