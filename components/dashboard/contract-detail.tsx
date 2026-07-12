"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { FormFieldsManager } from "@/components/dashboard/form-fields-manager";
import { EventForm } from "@/components/forms/event-form";
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
  useContractStatusAction,
  useUpdateContract,
} from "@/hooks/useContracts";
import { useCreateContractPixPayment } from "@/hooks/usePayments";
import { exportPaymentsCsv, exportRegistrationsCsv } from "@/services/exports";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getPaymentStatusLabel,
  getReadableMethod,
} from "@/lib/format";
import { ApiClientError, getErrorMessage } from "@/lib/get-error-message";
import type { ContractCreatePayload, ContractStatusAction, ContractUpdatePayload } from "@/types/contract";
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
    <Alert variant="success" title="Pix gerado">
      <div className="space-y-4">
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            Pagamento #{result.payment.id} · {getPaymentStatusLabel(result.payment.status)}
          </p>
          <p>
            Valor: {formatCurrency(Number(result.payment.amount), result.payment.currency)}
          </p>
        </div>

        {result.checkout_url ? (
          <Button asChild variant="secondary" size="sm">
            <a href={result.checkout_url} target="_blank" rel="noreferrer">
              Abrir pagamento
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
            <p className="mb-1 text-sm font-medium">Código Pix</p>
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
  const updateMutation = useUpdateContract(id);
  const publishMutation = useContractStatusAction(id, "publish");
  const closeMutation = useContractStatusAction(id, "close");
  const cancelMutation = useContractStatusAction(id, "cancel");
  const reopenMutation = useContractStatusAction(id, "reopen");

  const [pixResult, setPixResult] = useState<PaymentPixResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [eventFeedback, setEventFeedback] = useState<{
    message: string;
    variant: "success" | "warning";
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"registrations" | "payments" | null>(null);

  const contract = contractQuery.data ?? null;
  const payments = paymentsQuery.data ?? [];
  const registrations = registrationsQuery.data ?? [];
  const relatedDataUnavailable = Boolean(
    paymentsQuery.error || registrationsQuery.error
  );
  const financialLocked =
    relatedDataUnavailable || payments.length > 0 || registrations.length > 0;
  const statusActionPending =
    publishMutation.isPending ||
    closeMutation.isPending ||
    cancelMutation.isPending ||
    reopenMutation.isPending;

  function saveCsvFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleExport(kind: "registrations" | "payments") {
    if (!contract) return;

    setExportFeedback(null);
    setExporting(kind);

    try {
      const result = kind === "registrations"
        ? await exportRegistrationsCsv(contract.id)
        : await exportPaymentsCsv(contract.id);

      saveCsvFile(result.blob, result.filename);
      setExportFeedback(
        kind === "registrations"
          ? "Exportação de inscrições CSV iniciada com sucesso."
          : "Exportação de pagamentos CSV iniciada com sucesso."
      );
    } catch (error) {
      setExportFeedback(getErrorMessage(error, "Não foi possível exportar o CSV."));
    } finally {
      setExporting(null);
    }
  }

  async function refreshAfterVersionConflict() {
    await contractQuery.refetch();
    setIsEditing(false);
    setEventFeedback({
      variant: "warning",
      message:
        "O evento foi atualizado em outra sessão. Os dados mais recentes foram carregados; revise antes de tentar novamente.",
    });
  }

  async function handleUpdateEvent(
    payload: ContractCreatePayload | ContractUpdatePayload
  ) {
    await updateMutation.mutateAsync(payload as ContractUpdatePayload);
    setIsEditing(false);
    setEventFeedback({
      variant: "success",
      message: "Evento atualizado com sucesso.",
    });
  }

  function getStatusMutation(action: ContractStatusAction) {
    switch (action) {
      case "publish":
        return publishMutation;
      case "close":
        return closeMutation;
      case "cancel":
        return cancelMutation;
      case "reopen":
        return reopenMutation;
    }
  }

  async function handleStatusAction(action: ContractStatusAction) {
    if (!contract) return;

    const confirmations: Record<ContractStatusAction, string> = {
      publish:
        "Publicar este evento agora? A página pública e as inscrições poderão ficar disponíveis imediatamente.",
      close:
        "Encerrar este evento? Novas inscrições serão bloqueadas.",
      cancel:
        "Cancelar este evento? Essa ação é terminal e não poderá ser desfeita.",
      reopen:
        "Reabrir este evento? O início e o prazo de inscrição precisam estar no futuro.",
    };

    if (!window.confirm(confirmations[action])) return;

    setEventFeedback(null);
    try {
      await getStatusMutation(action).mutateAsync({ version: contract.version });
      setIsEditing(false);
      const messages: Record<ContractStatusAction, string> = {
        publish: "Evento publicado com sucesso.",
        close: "Evento encerrado com sucesso.",
        cancel: "Evento cancelado com sucesso.",
        reopen: "Evento reaberto com sucesso.",
      };
      setEventFeedback({ variant: "success", message: messages[action] });
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === "event_version_conflict"
      ) {
        await refreshAfterVersionConflict();
        return;
      }

      setEventFeedback({
        variant: "warning",
        message: getErrorMessage(
          error,
          "Não foi possível alterar a situação do evento."
        ),
      });
    }
  }

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

    if (!payer_email) {
      setFeedback("Informe o E-mail do participante para gerar o Pix.");
      return;
    }

    try {
      const result = await pixMutation.mutateAsync({
        contract_id: Number(contract.id),
        payer_email,
        ...(payer_name ? { payer_name } : {}),
        ...(payer_document ? { payer_document } : {}),
        ...(clientIdRaw ? { client_id: Number(clientIdRaw) } : {}),
      });

      setPixResult(result);
      setFeedback("Pagamento por Pix criado com sucesso.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Não foi possível gerar o Pix."));
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
        description="Não encontramos o evento solicitado."
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
                Consulte as informações do evento, acompanhe inscrições e gerencie pagamentos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(contract.status === "draft" || contract.status === "published") ? (
                <Button
                  variant="secondary"
                  disabled={statusActionPending || updateMutation.isPending}
                  onClick={() => {
                    setEventFeedback(null);
                    setIsEditing((current) => !current);
                  }}
                >
                  {isEditing ? "Fechar edição" : "Editar"}
                </Button>
              ) : null}

              {contract.status === "draft" ? (
                <Button
                  disabled={statusActionPending}
                  onClick={() => handleStatusAction("publish")}
                >
                  {publishMutation.isPending ? "Publicando..." : "Publicar"}
                </Button>
              ) : null}

              {contract.status === "published" ? (
                <Button
                  variant="secondary"
                  disabled={statusActionPending}
                  onClick={() => handleStatusAction("close")}
                >
                  {closeMutation.isPending ? "Encerrando..." : "Encerrar evento"}
                </Button>
              ) : null}

              {(contract.status === "draft" || contract.status === "published") ? (
                <Button
                  variant="destructive"
                  disabled={statusActionPending}
                  onClick={() => handleStatusAction("cancel")}
                >
                  {cancelMutation.isPending ? "Cancelando..." : "Cancelar evento"}
                </Button>
              ) : null}

              {contract.status === "closed" ? (
                <Button
                  disabled={statusActionPending}
                  onClick={() => handleStatusAction("reopen")}
                >
                  {reopenMutation.isPending ? "Reabrindo..." : "Reabrir evento"}
                </Button>
              ) : null}

              <Button asChild variant="secondary">
                <Link href={`/eventos/${contract.id}`}>Ver página pública</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/contracts">Voltar para eventos</Link>
              </Button>
            </div>
          </div>
        </div>

        {eventFeedback ? (
          <div className="mb-6">
            <Alert variant={eventFeedback.variant} title="Evento">
              <p>{eventFeedback.message}</p>
            </Alert>
          </div>
        ) : null}

        {isEditing ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Editar evento</CardTitle>
              <CardDescription>
                Altere as informações permitidas. A versão atual do evento é {contract.version}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm
                key={`${contract.id}-${contract.version}`}
                mode="edit"
                contract={contract}
                financialLocked={financialLocked}
                isSubmitting={updateMutation.isPending}
                onSubmit={handleUpdateEvent}
                onCancel={() => setIsEditing(false)}
                onVersionConflict={refreshAfterVersionConflict}
              />
            </CardContent>
          </Card>
        ) : null}

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

        {exportFeedback ? (
          <div className="mb-6">
            <Alert
              variant={exportFeedback.includes("sucesso") ? "success" : "destructive"}
              title="Exportação CSV"
            >
              <p>{exportFeedback}</p>
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
                  <p className="text-sm text-slate-500">Início</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.start_at ?? contract.start_date)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Fim</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(contract.end_at ?? contract.end_date)}
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
                  <p className="text-sm text-slate-500">Fuso horário</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {contract.timezone}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Versão de edição</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {contract.version}
                  </p>
                </div>

              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle>Campos do formulário</CardTitle>
                <CardDescription>
                  Defina as perguntas que serão exibidas no formulário público de inscrição.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormFieldsManager contractId={contract.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Inscrições vinculadas</CardTitle>
                  <CardDescription>
                    Participantes inscritos neste evento.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <EmptyState
                    title="Nenhuma inscrição para este evento"
                    description="As inscrições aparecerão aqui assim que os participantes confirmarem o envio do formulário."
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
                    Acompanhe os pagamentos relacionados a este evento.
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
                    description="Os pagamentos aparecerão aqui assim que forem gerados."
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
                              {payment.payer_name ?? "Participante"} · {payment.payer_email ?? "E-mail não informado"}
                            </p>
                          ) : null}
                          {payment.client_id ? (
                            <p className="text-xs text-slate-500">
                              Inscrição: #{payment.client_id}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exportações CSV</CardTitle>
                <CardDescription>
                  Baixe relatórios de inscrições e pagamentos em formato CSV.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="secondary"
                  type="button"
                  disabled={exporting !== null}
                  onClick={() => handleExport("registrations")}
                >
                  {exporting === "registrations" ? "Exportando inscrições..." : "Exportar inscrições CSV"}
                </Button>

                <Button
                  className="w-full"
                  variant="secondary"
                  type="button"
                  disabled={exporting !== null}
                  onClick={() => handleExport("payments")}
                >
                  {exporting === "payments" ? "Exportando pagamentos..." : "Exportar pagamentos CSV"}
                </Button>

                <p className="text-xs leading-5 text-slate-500">Os arquivos serão baixados diretamente para o seu dispositivo.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gerar pagamento por Pix</CardTitle>
                <CardDescription>
                  Gere um Pix com base no valor configurado para este evento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreatePix}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-950">Valor de referência</p>
                    <p>{formatCurrency(Number(contract.price), contract.currency)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_email">E-mail do participante</Label>
                    <Input
                      id="payer_email"
                      name="payer_email"
                      type="email"
                      placeholder="participante@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_name">Nome do participante</Label>
                    <Input id="payer_name" name="payer_name" placeholder="Nome completo" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer_document">Documento do participante</Label>
                    <Input
                      id="payer_document"
                      name="payer_document"
                      placeholder="CPF ou CNPJ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_id">Número da inscrição (opcional)</Label>
                    <Input
                      id="client_id"
                      name="client_id"
                      inputMode="numeric"
                      placeholder="Ex.: 50"
                    />
                  </div>

                  <Button className="w-full" type="submit" disabled={pixMutation.isPending}>
                    {pixMutation.isPending ? "Gerando Pix..." : "Gerar Pix"}
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
