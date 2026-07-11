"use client";

import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDate,
  getParticipantPaymentStatusLabel,
} from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type {
  ParticipantRegistrationDetail,
  ParticipantRegistrationPayment,
} from "@/types/participant-registration";
import type {
  ParticipantPaymentResponse,
  PublicPaymentRead,
} from "@/types/payment";

type PaymentView = Pick<
  ParticipantRegistrationPayment,
  | "id"
  | "attempt_number"
  | "status"
  | "amount"
  | "currency"
  | "checkout_url"
  | "qr_code_base64"
  | "copy_and_paste"
  | "expires_at"
>;

type PixPaymentBoxProps = {
  registration: ParticipantRegistrationDetail;
  result?: ParticipantPaymentResponse | null;
  canResumePayment?: boolean;
  isGenerating?: boolean;
  generationError?: unknown;
  onGeneratePix?: () => void;
};

function isPaymentRead(
  result: ParticipantPaymentResponse | null | undefined
): result is PublicPaymentRead {
  return Boolean(result && result.status !== "not_required");
}

function getQrImageSrc(qrCodeBase64: string) {
  return qrCodeBase64.startsWith("data:image")
    ? qrCodeBase64
    : `data:image/png;base64,${qrCodeBase64}`;
}

export function PixPaymentBox({
  registration,
  result,
  canResumePayment = true,
  isGenerating = false,
  generationError,
  onGeneratePix,
}: PixPaymentBoxProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const payment = useMemo<PaymentView | null>(() => {
    if (isPaymentRead(result)) return result;
    return registration.latest_payment;
  }, [registration.latest_payment, result]);

  const paymentStatus =
    result?.status === "not_required"
      ? "not_required"
      : payment?.status ?? registration.payment_status;

  const canGeneratePix = Boolean(
    onGeneratePix &&
      canResumePayment &&
      registration.registration_status !== "cancelled" &&
      paymentStatus !== "paid" &&
      paymentStatus !== "refunded" &&
      paymentStatus !== "not_required" &&
      (paymentStatus === "expired" ||
        paymentStatus === "error" ||
        (paymentStatus === "pending" && !payment))
  );

  async function handleCopyPix() {
    if (!payment?.copy_and_paste) return;

    try {
      await navigator.clipboard.writeText(payment.copy_and_paste);
      setCopyFeedback("Código Pix copiado.");
    } catch {
      setCopyFeedback(
        "Não foi possível copiar automaticamente. Selecione o código abaixo."
      );
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">Pagamento da inscrição</p>
          <p className="text-sm text-slate-600">Inscrição #{registration.id}</p>
        </div>
        <Badge
          variant={
            paymentStatus === "paid" || paymentStatus === "not_required"
              ? "success"
              : paymentStatus === "pending" ||
                    paymentStatus === "expired" ||
                    paymentStatus === "error"
                ? "warning"
                : "outline"
          }
        >
          {getParticipantPaymentStatusLabel(paymentStatus)}
        </Badge>
      </div>

      {paymentStatus === "paid" ? (
        <Alert variant="success" title="Pagamento confirmado">
          <p>Sua inscrição está confirmada para este evento.</p>
        </Alert>
      ) : null}

      {paymentStatus === "not_required" ? (
        <Alert variant="success" title="Inscrição confirmada">
          <p>
            {result?.status === "not_required"
              ? result.message
              : "Este evento é gratuito e não exige pagamento."}
          </p>
        </Alert>
      ) : null}

      {paymentStatus === "pending" && payment ? (
        <Alert variant="info" title="Pagamento pendente">
          <p>
            Sua inscrição já existe. Retome o pagamento usando o link, o QR Code
            ou o código Pix abaixo.
          </p>
        </Alert>
      ) : null}

      {paymentStatus === "pending" && !payment ? (
        <Alert variant="warning" title="Inscrição criada, pagamento pendente">
          <p>
            A inscrição foi preservada. Gere o Pix sem enviar o formulário
            novamente.
          </p>
        </Alert>
      ) : null}

      {paymentStatus === "expired" ? (
        <Alert variant="warning" title="O Pix anterior expirou">
          <p>
            Gere uma nova tentativa caso o backend ainda permita retomar esta
            inscrição.
          </p>
        </Alert>
      ) : null}

      {paymentStatus === "error" ? (
        <Alert variant="warning" title="A tentativa anterior falhou">
          <p>
            Sua inscrição continua salva. Você pode solicitar uma nova tentativa
            de pagamento.
          </p>
        </Alert>
      ) : null}

      {paymentStatus === "refunded" ? (
        <Alert variant="warning" title="Pagamento estornado">
          <p>Não é possível gerar uma nova cobrança por esta tela.</p>
        </Alert>
      ) : null}

      {registration.registration_status === "cancelled" ? (
        <Alert variant="warning" title="Inscrição cancelada">
          <p>Esta inscrição não aceita novas tentativas de pagamento.</p>
        </Alert>
      ) : null}

      {payment ? (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-500">Valor</p>
            <p className="font-semibold text-slate-950">
              {formatCurrency(Number(payment.amount), payment.currency)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Tentativa</p>
            <p className="font-semibold text-slate-950">
              {payment.attempt_number}
            </p>
          </div>
          {payment.expires_at ? (
            <div>
              <p className="text-slate-500">Expira em</p>
              <p className="font-semibold text-slate-950">
                {formatDate(payment.expires_at)}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {payment?.checkout_url && paymentStatus === "pending" ? (
        <Button asChild>
          <a href={payment.checkout_url} target="_blank" rel="noreferrer">
            Concluir pagamento
          </a>
        </Button>
      ) : null}

      {payment?.qr_code_base64 && paymentStatus === "pending" ? (
        <div className="max-w-xs rounded-2xl border border-slate-200 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="QR Code para pagamento Pix"
            className="h-auto w-full rounded-xl"
            src={getQrImageSrc(payment.qr_code_base64)}
          />
        </div>
      ) : null}

      {payment?.copy_and_paste && paymentStatus === "pending" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-950">Pix copia e cola</p>
            <Button variant="secondary" size="sm" onClick={handleCopyPix}>
              Copiar código
            </Button>
          </div>
          <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-950 p-3 text-xs text-white">
            {payment.copy_and_paste}
          </pre>
          {copyFeedback ? (
            <p className="text-xs text-slate-600">{copyFeedback}</p>
          ) : null}
        </div>
      ) : null}

      {!canResumePayment &&
      (paymentStatus === "expired" || paymentStatus === "error") ? (
        <Alert variant="warning" title="Pagamento não pode ser retomado">
          <p>Consulte a área “Minhas inscrições” para acompanhar o status.</p>
        </Alert>
      ) : null}

      {canGeneratePix ? (
        <Button onClick={onGeneratePix} disabled={isGenerating}>
          {isGenerating
            ? "Gerando Pix..."
            : paymentStatus === "expired"
              ? "Gerar novo Pix"
              : paymentStatus === "error"
                ? "Tentar novamente"
                : "Gerar Pix"}
        </Button>
      ) : null}

      {generationError ? (
        <Alert variant="destructive" title="Não foi possível gerar o pagamento">
          <p>
            {getErrorMessage(
              generationError,
              "Não foi possível gerar o pagamento agora. Tente novamente."
            )}
          </p>
        </Alert>
      ) : null}

      <p className="text-xs leading-5 text-slate-500">
        A confirmação definitiva é atualizada pelo backend após o webhook da
        OpenPix.
      </p>
    </div>
  );
}
