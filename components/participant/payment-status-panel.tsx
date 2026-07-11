"use client";

import { useEffect, useRef, useState } from "react";

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
import { useGenerateParticipantRegistrationPix } from "@/hooks/useParticipantRegistrations";
import {
  formatCurrency,
  formatDate,
  getParticipantPaymentStatusLabel,
} from "@/lib/format";
import { getErrorMessage, isApiNetworkError } from "@/lib/get-error-message";
import type { ParticipantRegistrationDetail } from "@/types/participant-registration";
import type { ParticipantPaymentResponse, PublicPaymentRead } from "@/types/payment";

type PaymentStatusPanelProps = {
  registration: ParticipantRegistrationDetail;
};

function isPaymentRead(result: ParticipantPaymentResponse): result is PublicPaymentRead {
  return result.status !== "not_required";
}

function getQrImageSrc(qrCodeBase64: string) {
  return qrCodeBase64.startsWith("data:image")
    ? qrCodeBase64
    : `data:image/png;base64,${qrCodeBase64}`;
}

export function PaymentStatusPanel({ registration }: PaymentStatusPanelProps) {
  const generatePix = useGenerateParticipantRegistrationPix();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const paymentAttemptKeyRef = useRef<string | null>(null);

  const payment = registration.latest_payment;
  const paymentStatus = payment?.status ?? registration.payment_status;
  const canGeneratePix =
    (registration.registration_status === "pending_payment" ||
      registration.registration_status === "expired") &&
    (!payment || paymentStatus === "expired" || paymentStatus === "error");

  useEffect(() => {
    if (paymentStatus === "paid" || paymentStatus === "not_required" || paymentStatus === "pending" && payment) {
      paymentAttemptKeyRef.current = null;
    }
  }, [payment, paymentStatus]);

  async function handleGeneratePix() {
    setSuccessMessage(null);

    const idempotencyKey =
      paymentAttemptKeyRef.current ?? crypto.randomUUID();
    paymentAttemptKeyRef.current = idempotencyKey;

    try {
      const result = await generatePix.mutateAsync({
        registrationId: registration.id,
        payload: { idempotency_key: idempotencyKey },
      });
      paymentAttemptKeyRef.current = null;

      if (isPaymentRead(result)) {
        setSuccessMessage(
          result.status === "paid"
            ? "Pagamento confirmado."
            : "Pix disponível para conclusão do pagamento."
        );
      } else {
        setSuccessMessage(result.message);
      }
    } catch (error) {
      if (!isApiNetworkError(error)) {
        paymentAttemptKeyRef.current = null;
      }
      // O erro seguro do backend é exibido no painel.
    }
  }

  async function handleCopyPix() {
    if (!payment?.copy_and_paste) return;

    try {
      await navigator.clipboard.writeText(payment.copy_and_paste);
      setCopyFeedback("Código Pix copiado.");
    } catch {
      setCopyFeedback("Não foi possível copiar automaticamente. Selecione o código abaixo.");
    }
  }

  return (
    <Card id="pagamento" className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Pagamento</CardTitle>
            <CardDescription>
              O status é atualizado pelo backend após a confirmação da OpenPix.
            </CardDescription>
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
      </CardHeader>

      <CardContent className="space-y-5">
        {paymentStatus === "paid" ? (
          <Alert variant="success" title="Pagamento confirmado">
            <p>Sua inscrição está confirmada para este evento.</p>
          </Alert>
        ) : null}

        {paymentStatus === "not_required" ? (
          <Alert variant="success" title="Pagamento não necessário">
            <p>Este evento é gratuito e sua inscrição está confirmada.</p>
          </Alert>
        ) : null}

        {paymentStatus === "pending" ? (
          <Alert variant="info" title="Pagamento pendente">
            <p>Use o link, o QR Code ou o código Pix para concluir o pagamento.</p>
          </Alert>
        ) : null}

        {paymentStatus === "expired" ? (
          <Alert variant="warning" title="O Pix anterior expirou">
            <p>Gere uma nova cobrança para continuar, caso a inscrição ainda permita pagamento.</p>
          </Alert>
        ) : null}

        {paymentStatus === "error" ? (
          <Alert variant="warning" title="O Pix não pôde ser gerado">
            <p>Você pode tentar novamente. O backend criará uma nova tentativa quando permitido.</p>
          </Alert>
        ) : null}

        {paymentStatus === "refunded" ? (
          <Alert variant="warning" title="Pagamento estornado">
            <p>Este pagamento foi estornado. Consulte o status da inscrição acima.</p>
          </Alert>
        ) : null}

        {payment ? (
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-slate-500">Valor</p>
              <p className="font-semibold text-slate-950">
                {formatCurrency(Number(payment.amount), payment.currency)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Tentativa</p>
              <p className="font-semibold text-slate-950">{payment.attempt_number}</p>
            </div>
            {payment.expires_at ? (
              <div className="sm:col-span-2">
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
            {copyFeedback ? <p className="text-xs text-slate-600">{copyFeedback}</p> : null}
          </div>
        ) : null}

        {canGeneratePix ? (
          <Button onClick={handleGeneratePix} disabled={generatePix.isPending}>
            {generatePix.isPending
              ? "Gerando Pix..."
              : paymentStatus === "expired"
                ? "Gerar novo Pix"
                : paymentStatus === "error"
                  ? "Tentar gerar Pix novamente"
                  : "Gerar Pix"}
          </Button>
        ) : null}

        {successMessage ? (
          <Alert variant="success" title="Atualização concluída">
            <p>{successMessage}</p>
          </Alert>
        ) : null}

        {generatePix.error ? (
          <Alert variant="destructive" title="Não foi possível gerar o pagamento">
            <p>
              {getErrorMessage(
                generatePix.error,
                "Não foi possível gerar o pagamento agora. Tente novamente."
              )}
            </p>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
