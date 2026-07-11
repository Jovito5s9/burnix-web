"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { RegistrationDetail } from "@/components/dashboard/registration-detail";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createContractPixPayment } from "@/services/payments";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type { PaymentPixResponse } from "@/types/payment";
import type {
  Registration,
  RegistrationPaymentStatus,
  RegistrationStatus,
} from "@/types/registration";

type RegistrationsTableProps = {
  contractId: string | number;
  registrations: Registration[];
  onPixCreated?: (result: PaymentPixResponse) => void;
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
  not_required: "Não exigido",
};

const registrationStatusClassMap: Record<RegistrationStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-700",
};

const paymentStatusClassMap: Record<RegistrationPaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-700",
  expired: "bg-slate-100 text-slate-700",
  error: "bg-red-100 text-red-700",
  refunded: "bg-slate-100 text-slate-700",
  not_required: "bg-blue-100 text-blue-700",
};

export function RegistrationsTable({
  contractId,
  registrations,
  onPixCreated,
}: RegistrationsTableProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pixMutation = useMutation({
    mutationFn: (registration: Registration) =>
      createContractPixPayment({
        contract_id: Number(contractId),
        client_id: registration.id,
        payer_email: registration.email ?? "",
        payer_name: registration.name,
        payer_document: registration.document ?? undefined,
      }),
    onSuccess: async (result) => {
      setFeedback("Pix da inscrição gerado com sucesso.");
      onPixCreated?.(result);
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({
        queryKey: ["payments", "contract", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["registrations", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "registrations"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "payments"],
      });
    },
    onError: (error) => {
      setFeedback(getErrorMessage(error, "Não foi possível gerar o Pix da inscrição."));
    },
  });

  return (
    <div className="space-y-3">
      {feedback ? (
        <Alert
          variant={feedback.includes("sucesso") ? "success" : "warning"}
          title="Inscrição"
        >
          <p>{feedback}</p>
        </Alert>
      ) : null}

      {registrations.map((registration) => {
        const isExpanded = expandedId === registration.id;
        const isGenerating =
          pixMutation.isPending && pixMutation.variables?.id === registration.id;

        return (
          <article
            key={registration.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-950">{registration.name}</p>
                <p className="text-sm text-slate-500">
                  {registration.email ?? "Sem e-mail"} · {registration.phone ?? "Sem telefone"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Inscrição #{registration.id} · Criada em {formatDate(registration.created_at)}
                </p>
              </div>

              <div className="flex flex-col gap-3 text-left lg:items-end lg:text-right">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge
                    variant="secondary"
                    className={registrationStatusClassMap[registration.registration_status]}
                  >
                    {registrationStatusLabels[registration.registration_status]}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={paymentStatusClassMap[registration.payment_status]}
                  >
                    Pagamento: {registrationPaymentStatusLabels[registration.payment_status]}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : registration.id)}
                  >
                    {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => pixMutation.mutate(registration)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Gerando Pix..." : "Gerar Pix"}
                  </Button>
                </div>
              </div>
            </div>

            {isExpanded ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <RegistrationDetail registration={registration} />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
