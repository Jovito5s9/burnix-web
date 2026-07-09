"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/feedback/status-badge";
import {
  useContractById,
  useContractPayments,
  useContractRegistrations,
} from "@/hooks/useContracts";
import { useCreateCheckout } from "@/hooks/useCheckout";
import { formatCurrency, formatDate, formatNumber, getReadableMethod } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type { RegistrationStatus, RegistrationPaymentStatus } from "@/types/registration";

type ContractDetailProps = {
  id: string;
};

const registrationStatusLabels: Record<RegistrationStatus, string> = {
  pending_payment: "Aguardando pagamento",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const registrationPaymentStatusLabels: Record<RegistrationPaymentStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  expired: "Expirado",
  error: "Erro",
  refunded: "Estornado",
};

export function ContractDetail({ id }: ContractDetailProps) {
  const contractQuery = useContractById(id);
  const paymentsQuery = useContractPayments(id);
  const registrationsQuery = useContractRegistrations(id);
  const checkoutMutation = useCreateCheckout();

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const contract = contractQuery.data ?? null;
  const payments = paymentsQuery.data ?? [];
  const registrations = registrationsQuery.data ?? [];

  async function handleCreateCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setCheckoutUrl(null);

    if (!contract) return;

    const formData = new FormData(event.currentTarget);
    const payer_email = String(formData.get("payer_email") ?? "").trim();
    const payer_name = String(formData.get("payer_name") ?? "").trim();

    if (!payer_email || !payer_name) {
      setFeedback("Informe nome e e-mail do pagador para gerar o checkout legado.");
      return;
    }

    try {
      const result = await checkoutMutation.mutateAsync({
        contract_id: Number(contract.id),
        payer_email,
        payer_name,
      });

      const resolvedCheckoutUrl = result.checkoutUrl || result.checkout_url;

      if (!resolvedCheckoutUrl) {
        setFeedback("O backend não retornou checkout_url.");
        return;
      }

      setCheckoutUrl(resolvedCheckoutUrl);
      setFeedback("Checkout legado criado com sucesso. Abrindo a URL de pagamento.");
      window.open(resolvedCheckoutUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Não foi possível criar o checkout."));
    }
  }

  if (contractQuery.isLoading || paymentsQuery.isLoading || registrationsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando evento..." />
      </div>
    );
  }

  if (contractQuery.error) {
    return (
      <Alert variant="destructive" title="Erro ao carregar evento">
        <div className="space-y-3">
          <p>{getErrorMessage(contractQuery.error, "Erro ao carregar evento")}</p>
          <Button asChild variant="secondary">
            <Link href="/contracts">Voltar para eventos</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  if (!contract) {
    return (
      <EmptyState
        title="Evento não encontrado"
        description="O identificador informado não retornou nenhum evento."
        action={
          <Button asChild>
            <Link href="/contracts">Voltar para eventos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Evento</Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Detalhe do evento</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Consulte dados do evento, inscrições e pagamentos usando os endpoints dedicados do contrato.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/contracts">Voltar para eventos</Link>
            </Button>
          </div>
        </div>

        {feedback ? (
          <div className="mb-6">
            <Alert variant={feedback.includes("sucesso") ? "success" : "warning"} title="Pagamento">
              <div className="space-y-3">
                <p>{feedback}</p>
                {checkoutUrl ? (
                  <Button asChild variant="secondary" size="sm">
                    <a href={checkoutUrl} target="_blank" rel="noreferrer">
                      Abrir checkout
                    </a>
                  </Button>
                ) : null}
              </div>
            </Alert>
          </div>
        ) : null}

        {paymentsQuery.error || registrationsQuery.error ? (
          <div className="mb-6">
            <Alert variant="warning" title="Dados relacionados parcialmente indisponíveis">
              <p>
                {getErrorMessage(
                  paymentsQuery.error ?? registrationsQuery.error,
                  "Não foi possível carregar pagamentos ou inscrições deste evento."
                )}
              </p>
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{contract.title}</CardTitle>
                <CardDescription>{contract.description ?? "Sem descrição cadastrada."}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <div className="mt-1">
                    <StatusBadge kind="contract" status={contract.status} />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Preço do evento</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {formatCurrency(Number(contract.price), contract.currency)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{contract.currency}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Capacidade</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{formatNumber(contract.capacity)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Cliente legado</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {contract.client_id ?? "Não vinculado"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Início</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{formatDate(contract.start_date)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Fim</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{formatDate(contract.end_date)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Prazo de inscrição</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.registration_deadline)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Criado em</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{formatDate(contract.created_at)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Atualizado em</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{formatDate(contract.updated_at)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">ID</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-950">{contract.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Inscrições vinculadas</CardTitle>
                  <CardDescription>
                    Dados carregados de `/contracts/{contract.id}/registrations`.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <EmptyState
                    title="Nenhuma inscrição para este evento"
                    description="Quando o fluxo público de inscrição for implementado, os participantes aparecerão aqui."
                  />
                ) : (
                  <div className="space-y-3">
                    {registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-medium text-slate-950">{registration.name}</p>
                            <p className="text-sm text-slate-500">
                              {registration.email ?? "Sem e-mail"} · {registration.phone ?? "Sem telefone"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Criada em {formatDate(registration.created_at)}
                            </p>
                          </div>
                          <div className="space-y-1 text-left text-sm lg:text-right">
                            <p className="font-medium text-slate-700">
                              {registrationStatusLabels[registration.registration_status]}
                            </p>
                            <p className="text-slate-500">
                              Pagamento: {registrationPaymentStatusLabels[registration.payment_status]}
                            </p>
                          </div>
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
                  <CardTitle>Pagamentos vinculados</CardTitle>
                  <CardDescription>
                    Histórico financeiro carregado de `/contracts/{contract.id}/payments`.
                  </CardDescription>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/payments">Ver pagamentos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <EmptyState
                    title="Nenhum pagamento para este evento"
                    description="Após uma cobrança ser criada e confirmada, o pagamento deverá aparecer aqui."
                  />
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div>
                          <p className="font-medium text-slate-950">
                            {formatCurrency(Number(payment.amount), payment.currency)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(payment.created_at)} · {payment.id}
                          </p>
                          {payment.client_id ? (
                            <p className="text-xs text-slate-500">Inscrição/cliente: {payment.client_id}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge kind="payment" status={payment.status} />
                          <p className="text-xs text-slate-500">
                            {getReadableMethod(payment.payment_method ?? payment.method)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Gerar checkout legado</CardTitle>
                <CardDescription>
                  Mantido apenas para compatibilidade com `/payments/contracts/{contract.id}/checkout`. O valor usado pelo backend deve vir do preço do evento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateCheckout}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-950">Valor de referência</p>
                    <p>{formatCurrency(Number(contract.price), contract.currency)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_name">Nome do pagador</Label>
                    <Input id="payer_name" name="payer_name" placeholder="Nome completo" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_email">E-mail do pagador</Label>
                    <Input id="payer_email" name="payer_email" type="email" placeholder="pagador@email.com" required />
                  </div>

                  <Button className="w-full" type="submit" disabled={checkoutMutation.isPending}>
                    {checkoutMutation.isPending ? "Gerando checkout..." : "Gerar checkout legado"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
