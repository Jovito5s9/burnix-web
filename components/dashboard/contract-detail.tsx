"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

import { useContractById } from "@/hooks/useContracts";
import { useCreateCheckout } from "@/hooks/useCheckout";
import { usePayments } from "@/hooks/usePayments";

import { formatCurrency, formatDate } from "@/lib/format";

import type { Payment } from "@/types/payment";

type ContractDetailProps = {
  id: string;
};

export function ContractDetail({
  id,
}: ContractDetailProps) {

  // =========================================================
  // HOOKS
  // =========================================================

  const contractQuery = useContractById(id);
  const paymentsQuery = usePayments(id);
  const checkoutMutation = useCreateCheckout();

  // =========================================================
  // STATES
  // =========================================================

  const [amount, setAmount] = useState("");

  const [checkout_url, set_checkout_url] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState<string | null>(null);

  // =========================================================
  // DATA
  // =========================================================

  const contract = contractQuery.data ?? null;

  const contract_payments = useMemo(
    () =>
      paymentsQuery.payments.filter(
        (payment) =>
          payment.contract_id === Number(id)
      ),
    [id, paymentsQuery.payments]
  );

  const suggested_amount = contract
    ? Number(contract.price)
    : 0;

  // =========================================================
  // CREATE CHECKOUT
  // =========================================================

  async function handleCreateCheckout(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFeedback(null);
    set_checkout_url(null);

    if (!contract) return;

    const final_amount = Number(
      amount || suggested_amount
    );

    if (
      !Number.isFinite(final_amount) ||
      final_amount <= 0
    ) {
      setFeedback(
        "Informe um valor válido para gerar o checkout."
      );

      return;
    }

    try {
      const result =
        await checkoutMutation.mutateAsync({
          contract_id: Number(contract.id),

          // TEMPORÁRIO
          payer_email: "teste@email.com",
          payer_name: "Teste",
        });

      const resolved_checkout_url =
        result.checkoutUrl ||
        result.checkout_url;

      if (!resolved_checkout_url) {
        setFeedback(
          "O backend não retornou checkout_url."
        );

        return;
      }

      set_checkout_url(
        resolved_checkout_url
      );

      setFeedback(
        "Checkout criado com sucesso. Abrindo a URL de pagamento."
      );

      window.open(
        resolved_checkout_url,
        "_blank",
        "noopener,noreferrer"
      );

    } catch (error) {

      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o checkout."
      );
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (
    contractQuery.isLoading ||
    paymentsQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Carregando contrato..." />
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (contractQuery.error) {
    return (
      <Alert
        variant="destructive"
        title="Erro ao carregar contrato"
      >
        <div className="space-y-3">
          <p>
            {
              (contractQuery.error as any)
                ?.response?.data?.detail?.[0]
                ?.msg ??
              "Erro ao carregar contrato"
            }
          </p>

          <Button
            asChild
            variant="secondary"
          >
            <Link href="/contracts">
              Voltar para contratos
            </Link>
          </Button>
        </div>
      </Alert>
    );
  }

  // =========================================================
  // EMPTY
  // =========================================================

  if (!contract) {
    return (
      <EmptyState
        title="Contrato não encontrado"
        description="O identificador informado não retornou nenhum contrato."
        action={
          <Button asChild>
            <Link href="/contracts">
              Voltar para contratos
            </Link>
          </Button>
        }
      />
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-3">
          <Badge>
            Contrato
          </Badge>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Detalhe do contrato
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Abra o detalhe, acompanhe o histórico
              e gere o checkout.
            </p>
          </div>
        </div>

        {/* FEEDBACK */}

        {feedback ? (
          <div className="mb-6">
            <Alert
              variant={
                feedback.includes("sucesso")
                  ? "success"
                  : "warning"
              }
              title="Checkout"
            >
              <div className="space-y-3">

                <p>{feedback}</p>

                {checkout_url ? (
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                  >
                    <a
                      href={checkout_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir checkout
                    </a>
                  </Button>
                ) : null}
              </div>
            </Alert>
          </div>
        ) : null}

        {/* CONTENT */}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">

          {/* LEFT */}

          <div className="space-y-6">

            {/* CONTRACT */}

            <Card>
              <CardHeader>
                <CardTitle>
                  {contract.title}
                </CardTitle>

                <CardDescription>
                  {contract.title}
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-2">

                <div>
                  <p className="text-sm text-slate-500">
                    Status
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      kind="contract"
                      status={contract.status}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Valor do contrato
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {formatCurrency(Number(contract.price))}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Criado em
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatDate(
                      contract.created_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    ID
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-950">
                    {contract.id}
                  </p>
                </div>

              </CardContent>
            </Card>

            {/* PAYMENTS */}

            <Card>

              <CardHeader className="flex flex-row items-start justify-between gap-4">

                <div>
                  <CardTitle>
                    Pagamentos vinculados
                  </CardTitle>

                  <CardDescription>
                    Histórico financeiro relacionado
                    a este contrato.
                  </CardDescription>
                </div>

                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                >
                  <Link href="/payments">
                    Ver pagamentos
                  </Link>
                </Button>

              </CardHeader>

              <CardContent>

                {contract_payments.length === 0 ? (

                  <EmptyState
                    title="Nenhum pagamento para este contrato"
                    description="Após o checkout ser confirmado, o pagamento deverá aparecer aqui."
                  />

                ) : (

                  <div className="space-y-3">

                    {contract_payments.map(
                      (payment: Payment) => (

                        <div
                          key={payment.id}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >

                          <div>
                            <p className="font-medium text-slate-950">
                              {formatCurrency(
                                (Number(payment.amount))
                              )}
                            </p>

                            <p className="text-sm text-slate-500">
                              {formatDate(
                                payment.created_at
                              )}{" "}
                              · {payment.id}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">

                            <StatusBadge
                              kind="payment"
                              status={payment.status}
                            />

                            <p className="text-xs text-slate-500">
                              {payment.method
                                ? payment.method.toUpperCase()
                                : "—"}
                            </p>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* RIGHT */}

          <div>

            <Card>

              <CardHeader>

                <CardTitle>
                  Gerar checkout
                </CardTitle>

                <CardDescription>
                  Crie um checkout do Mercado Pago.
                </CardDescription>

              </CardHeader>

              <CardContent>

                <form
                  className="space-y-4"
                  onSubmit={handleCreateCheckout}
                >

                  <div className="space-y-2">

                    <Label htmlFor="amount">
                      Valor
                    </Label>

                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={String(
                        (
                          suggested_amount ?? 0
                        ).toFixed(2)
                      )}
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value
                        )
                      }
                    />

                    <p className="text-xs text-slate-500">
                      Se vazio, será usado o valor do contrato.
                    </p>

                  </div>

                  <Button
                    className="w-full"
                    type="submit"
                    disabled={
                      checkoutMutation.isPending
                    }
                  >
                    {checkoutMutation.isPending
                      ? "Gerando checkout..."
                      : "Gerar checkout"}
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