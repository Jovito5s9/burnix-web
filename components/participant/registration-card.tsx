"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
  formatEventDateRange,
  getParticipantPaymentStatusLabel,
  getParticipantRegistrationStatusLabel,
} from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type { ParticipantRegistration } from "@/types/participant-registration";

type RegistrationCardProps = {
  registration: ParticipantRegistration;
};

function registrationBadgeVariant(
  status: ParticipantRegistration["registration_status"]
): "success" | "warning" | "outline" {
  if (status === "confirmed") return "success";
  if (status === "pending_payment") return "warning";
  return "outline";
}

function paymentBadgeVariant(
  status: ParticipantRegistration["payment_status"]
): "success" | "warning" | "secondary" | "outline" {
  if (status === "paid" || status === "not_required") return "success";
  if (status === "pending" || status === "expired" || status === "error") {
    return "warning";
  }
  if (status === "refunded") return "secondary";
  return "outline";
}

export function RegistrationCard({ registration }: RegistrationCardProps) {
  const router = useRouter();
  const generatePix = useGenerateParticipantRegistrationPix();
  const detailHref = `/minhas-inscricoes/${registration.id}`;
  const paymentStatus = registration.latest_payment?.status ?? registration.payment_status;
  const canGenerateNewPix =
    registration.registration_status === "pending_payment" &&
    (paymentStatus === "expired" || paymentStatus === "error");
  const isPaymentPending = registration.payment_status === "pending";

  async function handleGeneratePix() {
    try {
      await generatePix.mutateAsync({ registrationId: registration.id });
      router.push(`${detailHref}#pagamento`);
    } catch {
      // O feedback seguro é exibido abaixo dos botões.
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="break-words text-xl">
              {registration.event.title}
            </CardTitle>
            <CardDescription>
              {formatEventDateRange(
                registration.event.start_date,
                registration.event.end_date
              )}
            </CardDescription>
          </div>
          <p className="shrink-0 text-lg font-semibold text-slate-950">
            {formatCurrency(
              Number(registration.event.price),
              registration.event.currency
            )}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant={registrationBadgeVariant(registration.registration_status)}>
            Inscrição: {getParticipantRegistrationStatusLabel(registration.registration_status)}
          </Badge>
          <Badge variant={paymentBadgeVariant(registration.payment_status)}>
            Pagamento: {getParticipantPaymentStatusLabel(registration.payment_status)}
          </Badge>
        </div>

        {registration.payment_status === "paid" ? (
          <Alert variant="success" title="Pagamento confirmado">
            <p>Sua inscrição está confirmada para este evento.</p>
          </Alert>
        ) : null}

        {registration.payment_status === "not_required" ? (
          <Alert variant="success" title="Inscrição confirmada">
            <p>Este evento não exige pagamento.</p>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={detailHref}>Ver inscrição</Link>
          </Button>

          {isPaymentPending ? (
            <Button asChild size="sm">
              <Link href={`${detailHref}#pagamento`}>Concluir pagamento</Link>
            </Button>
          ) : null}

          {canGenerateNewPix ? (
            <Button
              size="sm"
              onClick={handleGeneratePix}
              disabled={generatePix.isPending}
            >
              {generatePix.isPending
                ? "Gerando Pix..."
                : paymentStatus === "expired"
                  ? "Gerar novo Pix"
                  : "Tentar gerar Pix novamente"}
            </Button>
          ) : null}
        </div>

        {generatePix.error ? (
          <Alert variant="destructive" title="Não foi possível gerar o Pix">
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
