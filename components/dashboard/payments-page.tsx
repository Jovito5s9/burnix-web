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
import { useContracts } from "@/hooks/useContracts";
import { usePayments } from "@/hooks/usePayments";
import { formatCurrency, formatDate, getReadableMethod } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";

function truncatePixCode(value: string) {
  return value.length > 96 ? `${value.slice(0, 96)}...` : value;
}

export function PaymentsPage() {
  const paymentsQuery = usePayments({ skip: 0, limit: 100 });
  const contractsQuery = useContracts({ skip: 0, limit: 100 });

  if (paymentsQuery.isLoading || contractsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando pagamentos..." />
      </div>
    );
  }

  if (paymentsQuery.error || contractsQuery.error) {
    const message = getErrorMessage(
      paymentsQuery.error ?? contractsQuery.error,
      "Não foi possível carregar os pagamentos."
    );

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

  const contractMap = new Map(
    contractsQuery.contracts.map((contract) => [contract.id.toString(), contract])
  );

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Pagamentos</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Histórico de pagamentos
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Consulte valores, participantes, taxas e o andamento de cada pagamento.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Pagamentos registrados</CardTitle>
              <CardDescription>{paymentsQuery.total} pagamentos encontrados.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/contracts">Ver eventos</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">Ir para a visão geral</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paymentsQuery.payments.length === 0 ? (
              <EmptyState
                title="Nenhum pagamento encontrado"
                description="Os pagamentos aparecerão aqui assim que forem gerados."
                action={
                  <Button variant="secondary" asChild>
                    <Link href="/contracts">Ir para eventos</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4">
                {paymentsQuery.payments.map((payment) => {
                  const contract = contractMap.get(payment.contract_id.toString());

                  return (
                    <article
                      key={payment.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-950">
                              {formatCurrency(Number(payment.amount), payment.currency)}
                            </h3>
                            <StatusBadge kind="payment" status={payment.status} />
                          </div>

                          <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                            <p>
                              Evento:{" "}
                              <span className="font-medium text-slate-950">
                                {contract?.title ?? payment.contract_id}
                              </span>
                            </p>
                            <p>
                              Criado em:{" "}
                              <span className="font-medium text-slate-950">
                                {formatDate(payment.created_at)}
                              </span>
                            </p>
                            <p>
                              Participante:{" "}
                              <span className="font-medium text-slate-950">
                                {payment.payer_name ?? "—"}
                              </span>
                            </p>
                            <p>
                              E-mail:{" "}
                              <span className="font-medium text-slate-950">
                                {payment.payer_email ?? "—"}
                              </span>
                            </p>
                            <p>
                              Documento:{" "}
                              <span className="font-medium text-slate-950">
                                {payment.payer_document ?? "—"}
                              </span>
                            </p>
                            <p>
                              Inscrição:{" "}
                              <span className="font-medium text-slate-950">
                                {payment.client_id ?? "—"}
                              </span>
                            </p>
                          </div>

                          {payment.copy_and_paste ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Pix copia e cola
                              </p>
                              <p className="mt-1 break-all text-xs text-slate-700">
                                {truncatePixCode(payment.copy_and_paste)}
                              </p>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 xl:min-w-72 xl:text-right">
                          <p>
                            Forma de pagamento:{" "}
                            <span className="font-medium text-slate-950">
                              {getReadableMethod(payment.payment_method ?? payment.method)}
                            </span>
                          </p>
                          <p>
                            Taxa da plataforma:{" "}
                            <span className="font-medium text-slate-950">
                              {formatCurrency(Number(payment.platform_fee_amount), payment.currency)}
                            </span>
                          </p>
                          <p>
                            Valor líquido:{" "}
                            <span className="font-medium text-slate-950">
                              {formatCurrency(Number(payment.net_amount), payment.currency)}
                            </span>
                          </p>
                          <p>
                            Expira em:{" "}
                            <span className="font-medium text-slate-950">
                              {formatDate(payment.expired_at)}
                            </span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 xl:justify-end">
                            {payment.checkout_url ? (
                              <Button asChild variant="secondary" size="sm">
                                <a href={payment.checkout_url} target="_blank" rel="noreferrer">
                                  Abrir pagamento
                                </a>
                              </Button>
                            ) : null}
                            <Button asChild variant="secondary" size="sm">
                              <Link href={`/contracts/${payment.contract_id}`}>Abrir evento</Link>
                            </Button>
                          </div>
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
