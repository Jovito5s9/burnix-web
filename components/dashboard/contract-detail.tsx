"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { RegistrationsTable } from "@/components/dashboard/registrations-table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  useContractById,
  useContractPayments,
  useContractRegistrations,
} from "@/hooks/useContracts";
import { useCreateContractPixPayment } from "@/hooks/usePayments";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getReadableMethod,
} from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type { PaymentPixResponse } from "@/types/payment";

type ContractDetailProps = {
  id: string;
};

function getQrImageSrc(qrCodeBase64: string) {
  return qrCodeBase64.startsWith("data:image")
    ? qrCodeBase64
    : `data:image/png;base64,${qrCodeBase64}`;
}

function PixResultBox({ result }: { result: PaymentPixResponse }) {
  return (
    <Alert variant="success" title="Pix/OpenPix gerado">
      <div className="space-y-4">
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            Pagamento #{result.payment.id} · Status: {result.payment.status}
          </p>
          <p>
            Valor: {formatCurrency(Number(result.payment.amount), result.payment.currency)}
          </p>
        </div>

        {result.checkout_url ? (
          <Button asChild variant="secondary" size="sm">
            <a href={result.checkout_url} target="_blank" rel="noreferrer">
              Abrir checkout da OpenPix
            </a>
          </Button>
        ) : null}

        {result.qr_code_base64 ? (
          <div className="max-w-xs rounded-2xl border border-green-200 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="QR Code Pix"
              className="h-auto w-full rounded-xl"
              src={getQrImageSrc(result.qr_code_base64)}
            />
          </div>
        ) : null}

        {result.copy_and_paste ? (
          <div>
            <p className="mb-1 text-sm font-medium">Código Pix copia e cola</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-white p-3 text-xs text-slate-800">
              {result.copy_and_paste}
            </pre>
          </div>
        ) : result.qr_code ? (
          <div>
            <p className="mb-1 text-sm font-medium">BR Code Pix</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-white p-3 text-xs text-slate-800">
              {result.qr_code}
            </pre>
          </div>
        ) : null}
      </div>
    </Alert>
  );
}

export function ContractDetail({ id }: ContractDetailProps) {
  const contractQuery = useContractById(id);
  const paymentsQuery = useContractPayments(id);
  const registrationsQuery = useContractRegistrations(id);
  const pixMutation = useCreateContractPixPayment();

  const [pixResult, setPixResult] = useState<PaymentPixResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const contract = contractQuery.data ?? null;
  const payments = paymentsQuery.data ?? [];
  const registrations = registrationsQuery.data ?? [];

  async function handleCreatePix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setPixResult(null);

    if (!contract) return;

    const formData = new FormData(event.currentTarget);
    const payer_email = String(formData.get("payer_email") ?? "").trim();
    const payer_name = String(formData.get("payer_name") ?? "").trim();
    const payer_document = String(formData.get("payer_document") ?? "").trim();
    const clientIdRaw = String(formData.get("client_id") ?? "").trim();
    const idempotency_key = String(formData.get("idempotency_key") ?? "").trim();

    if (!payer_email) {
      setFeedback("Informe o e-mail do pagador para gerar o Pix/OpenPix.");
      return;
    }

    try {
      const result = await pixMutation.mutateAsync({
        contract_id: Number(contract.id),
        payer_email,
        ...(payer_name ? { payer_name } : {}),
        ...(payer_document ? { payer_document } : {}),
        ...(clientIdRaw ? { client_id: Number(clientIdRaw) } : {}),
        ...(idempotency_key ? { idempotency_key } : {}),
      });

      setPixResult(result);
      setFeedback("Cobrança Pix/OpenPix criada com sucesso.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Não foi possível gerar o Pix/OpenPix."));
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
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Detalhe do evento
              </h1>
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
            <Alert
              variant={feedback.includes("sucesso") || feedback.includes("criada") ? "success" : "warning"}
              title="Pagamento"
            >
              <p>{feedback}</p>
            </Alert>
          </div>
        ) : null}

        {pixResult ? (
          <div className="mb-6">
            <PixResultBox result={pixResult} />
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
                <CardDescription>
                  {contract.description ?? "Sem descrição cadastrada."}
                </CardDescription>
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
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {contract.currency}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Capacidade</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatNumber(contract.capacity)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Cliente legado</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {contract.client_id ?? "Não vinculado"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Início</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.start_date)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Fim</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.end_date)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Prazo de inscrição</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.registration_deadline)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Criado em</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Atualizado em</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.updated_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">ID</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-950">
                    {contract.id}
                  </p>
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
                  <RegistrationsTable
                    contractId={contract.id}
                    registrations={registrations}
                    onPixCreated={setPixResult}
                  />
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
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-start"
                      >
                        <div>
                          <p className="font-medium text-slate-950">
                            {formatCurrency(Number(payment.amount), payment.currency)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(payment.created_at)} · Pagamento #{payment.id}
                          </p>
                          {payment.payer_email || payment.payer_name ? (
                            <p className="text-xs text-slate-500">
                              {payment.payer_name ?? "Pagador"} · {payment.payer_email ?? "sem e-mail"}
                            </p>
                          ) : null}
                          {payment.client_id ? (
                            <p className="text-xs text-slate-500">
                              Inscrição/cliente: {payment.client_id}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <StatusBadge kind="payment" status={payment.status} />
                          <p className="text-xs text-slate-500">
                            {payment.provider} · {getReadableMethod(payment.payment_method ?? payment.method)}
                          </p>
                          {payment.status_detail ? (
                            <p className="text-xs text-slate-500">
                              Detalhe: {payment.status_detail}
                            </p>
                          ) : null}
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
                <CardTitle>Gerar Pix/OpenPix</CardTitle>
                <CardDescription>
                  Usa `POST /payments/contracts/{contract.id}/pix`. O backend calcula o valor com base no preço do evento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreatePix}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-950">Valor de referência</p>
                    <p>{formatCurrency(Number(contract.price), contract.currency)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_email">E-mail do pagador</Label>
                    <Input
                      id="payer_email"
                      name="payer_email"
                      type="email"
                      placeholder="pagador@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_name">Nome do pagador</Label>
                    <Input id="payer_name" name="payer_name" placeholder="Nome completo" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_document">Documento do pagador</Label>
                    <Input
                      id="payer_document"
                      name="payer_document"
                      placeholder="CPF/CNPJ sem formatação"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_id">ID da inscrição/cliente opcional</Label>
                    <Input
                      id="client_id"
                      name="client_id"
                      inputMode="numeric"
                      placeholder="Ex.: 50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idempotency_key">Chave de idempotência opcional</Label>
                    <Input
                      id="idempotency_key"
                      name="idempotency_key"
                      placeholder="pedido-123"
                    />
                  </div>

                  <Button className="w-full" type="submit" disabled={pixMutation.isPending}>
                    {pixMutation.isPending ? "Gerando Pix..." : "Gerar Pix/OpenPix"}
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
