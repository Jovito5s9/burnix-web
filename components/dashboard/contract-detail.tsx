"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useContractById } from "@/hooks/useContracts";
import { useCreatePayment, usePayments } from "@/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PaymentMethod } from "@/types/payment";

type ContractDetailProps = {
  id: string;
};

const paymentMethods: Array<{ label: string; value: PaymentMethod }> = [
  { label: "PIX", value: "pix" },
  { label: "Cartão", value: "card" },
  { label: "Boleto", value: "boleto" },
];

export function ContractDetail({ id }: ContractDetailProps) {
  const contractQuery = useContractById(id);
  const paymentsQuery = usePayments(id);
  const createPaymentMutation = useCreatePayment();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [feedback, setFeedback] = useState<string | null>(null);

  const contract = contractQuery.data ?? null;

  const contractPayments = useMemo(
    () => paymentsQuery.payments.filter((payment) => payment.contractId === id),
    [id, paymentsQuery.payments]
  );

  const suggestedAmount = contract ? contract.amount : 0;

  async function handleCreatePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!contract) return;

    const finalAmount = Number(amount || suggestedAmount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      setFeedback("Informe um valor válido para gerar o pagamento.");
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        contractId: contract.id,
        amount: finalAmount,
        method,
      });
      setAmount("");
      setFeedback("Pagamento criado com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível criar o pagamento.");
    }
  }

  if (contractQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando contrato..." />
      </div>
    );
  }

  if (contractQuery.error) {
    return (
      <Alert variant="destructive" title="Erro ao carregar contrato">
        <div className="space-y-3">
          <p>{contractQuery.error.message}</p>
          <Button asChild variant="secondary">
            <Link href="/contracts">Voltar para contratos</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  if (!contract) {
    return (
      <EmptyState
        title="Contrato não encontrado"
        description="O identificador informado não retornou nenhum contrato."
        action={
          <Button asChild>
            <Link href="/contracts">Voltar para contratos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <Badge>Contrato</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Detalhe do contrato</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Abra o detalhe, acompanhe o histórico e gere um pagamento sem sair do fluxo.
            </p>
          </div>
        </div>

        {feedback ? (
          <div className="mb-6">
            <Alert variant={feedback.includes("sucesso") ? "success" : "warning"} title="Ação no contrato">
              {feedback}
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{contract.customerName}</CardTitle>
                <CardDescription>{contract.planName}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <div className="mt-1">
                    <StatusBadge kind="contract" status={contract.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Valor do contrato</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(contract.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Criado em</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{formatDate(contract.createdAt)}</p>
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
                  <CardTitle>Pagamentos vinculados</CardTitle>
                  <CardDescription>Histórico financeiro relacionado a este contrato.</CardDescription>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/payments">Ver pagamentos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {contractPayments.length === 0 ? (
                  <EmptyState
                    title="Nenhum pagamento para este contrato"
                    description="Crie o primeiro pagamento ao lado para validar o fluxo completo."
                  />
                ) : (
                  <div className="space-y-3">
                    {contractPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div>
                          <p className="font-medium text-slate-950">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-slate-500">
                            {formatDate(payment.createdAt)} · {payment.id}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge kind="payment" status={payment.status} />
                          <p className="text-xs text-slate-500">{payment.method ? payment.method.toUpperCase() : "—"}</p>
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
                <CardTitle>Gerar pagamento</CardTitle>
                <CardDescription>
                  Crie um pagamento para este contrato com optimistic update e feedback visual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreatePayment}>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={suggestedAmount.toFixed(2)}
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                    />
                    <p className="text-xs text-slate-500">Se vazio, será usado o valor do contrato.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="method">Método</Label>
                    <select
                      id="method"
                      value={method}
                      onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    >
                      {paymentMethods.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    className="w-full"
                    type="submit"
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? "Gerando pagamento..." : "Gerar pagamento"}
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
