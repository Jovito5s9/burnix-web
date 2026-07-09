"use client";

import Link from "next/link";
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
import { StatusBadge } from "@/components/feedback/status-badge";
import { useBillingProfile } from "@/hooks/useBillingProfile";
import { useClients } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { usePayments } from "@/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/format";

export function DashboardOverview() {
  const contractsQuery = useContracts({ skip: 0, limit: 50 });
  const paymentsQuery = usePayments({ skip: 0, limit: 50 });
  const clientsQuery = useClients({ skip: 0, limit: 100 });
  const billingProfileQuery = useBillingProfile();

  if (
    contractsQuery.isLoading ||
    paymentsQuery.isLoading ||
    clientsQuery.isLoading ||
    billingProfileQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando visão geral..." />
      </div>
    );
  }

  if (contractsQuery.error || paymentsQuery.error || clientsQuery.error) {
    const message =
      contractsQuery.error?.message ??
      paymentsQuery.error?.message ??
      clientsQuery.error?.message ??
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

  const publishedEvents = contractsQuery.contracts.filter(
    (contract) => contract.status === "published"
  ).length;
  const pendingPayments = paymentsQuery.payments.filter(
    (payment) => payment.status === "pending"
  ).length;
  const paidPayments = paymentsQuery.payments.filter(
    (payment) => payment.status === "paid"
  ).length;
  const totalRevenue = paymentsQuery.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalRegistrations = clientsQuery.clients.length;
  const confirmedRegistrations = clientsQuery.clients.filter(
    (client) => client.registration_status === "confirmed"
  ).length;
  const pendingRegistrations = clientsQuery.clients.filter(
    (client) => client.registration_status === "pending_payment"
  ).length;

  const billingProfile = billingProfileQuery.data ?? null;
  const billingStatusLabel = billingProfile
    ? {
        pending: "Pendente",
        active: "Ativo",
        suspended: "Suspenso",
        cancelled: "Cancelado",
      }[billingProfile.billing_status] ?? billingProfile.billing_status
    : billingProfileQuery.error
      ? "Indisponível"
      : "Não criado";

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
              Acompanhe eventos, inscrições, participantes e pagamentos Pix/OpenPix processados pelo backend Burnix.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader>
              <CardDescription>Eventos totais</CardDescription>
              <CardTitle>{contractsQuery.total}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {publishedEvents} eventos publicados agora.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Inscrições totais</CardDescription>
              <CardTitle>{totalRegistrations}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Participantes/clients retornados por `/clients/`.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Inscrições confirmadas</CardDescription>
              <CardTitle>{confirmedRegistrations}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {pendingRegistrations} inscrições aguardando pagamento.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Receita confirmada</CardDescription>
              <CardTitle>{formatCurrency(totalRevenue)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {paidPayments} pagamentos pagos e {pendingPayments} pendentes.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Perfil de cobrança</CardDescription>
              <CardTitle>{billingStatusLabel}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {billingProfile ? (
                <>Chave Pix {billingProfile.pix_key ? "configurada" : "não informada"}.</>
              ) : billingProfileQuery.error ? (
                <>Não foi possível consultar `/billing-profiles/me`.</>
              ) : (
                <>Crie o perfil em configurações para cadastrar a chave Pix.</>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Eventos recentes</CardTitle>
                <CardDescription>Últimos eventos cadastrados na plataforma.</CardDescription>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/contracts">Ver eventos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentContracts.length === 0 ? (
                <EmptyState
                  title="Nenhum evento encontrado"
                  description="Crie o primeiro evento para começar a receber inscrições."
                  action={
                    <Button variant="secondary" asChild>
                      <Link href="/contracts">Ir para eventos</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {recentContracts.map((contract) => (
                    <Link
                      key={contract.id}
                      href={`/contracts/${contract.id}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-950">{contract.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Criado em {formatDate(contract.created_at)}
                          </p>
                        </div>
                        <StatusBadge kind="contract" status={contract.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Pagamentos recentes</CardTitle>
                <CardDescription>Últimas transações Pix/OpenPix recebidas pelo backend.</CardDescription>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/payments">Ver pagamentos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <EmptyState
                  title="Nenhum pagamento encontrado"
                  description="As cobranças Pix/OpenPix aparecerão aqui depois de geradas."
                />
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <Link
                      key={payment.id}
                      href={`/contracts/${payment.contract_id}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-950">
                            {formatCurrency(Number(payment.amount), payment.currency)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {payment.payer_name ?? payment.payer_email ?? "Pagador não informado"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Criado em {formatDate(payment.created_at)}
                          </p>
                        </div>
                        <StatusBadge kind="payment" status={payment.status} />
                      </div>
                    </Link>
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
