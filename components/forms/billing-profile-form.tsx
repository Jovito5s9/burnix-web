"use client";

import { type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useBillingProfile, useUpsertBillingProfile } from "@/hooks/useBillingProfile";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import type { PixKeyType } from "@/types/billing-profile";

const pixKeyTypeOptions: Array<{ value: PixKeyType; label: string }> = [
  { value: "email", label: "E-mail" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave aleatória" },
  { value: "outro", label: "Outro" },
];

const billingStatusLabels: Record<string, string> = {
  pending: "Pendente",
  active: "Ativo",
  suspended: "Suspenso",
  cancelled: "Cancelado",
};

const planLabels: Record<string, string> = {
  free: "Gratuito",
  starter: "Inicial",
  basic: "Básico",
  pro: "Profissional",
  professional: "Profissional",
  enterprise: "Empresarial",
};

function getPlanLabel(plan: string | null) {
  if (!plan) return "Não informado";
  return planLabels[plan.toLowerCase()] ?? "Plano personalizado";
}

function nullable(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue ? stringValue : null;
}

export function BillingProfileForm() {
  const profileQuery = useBillingProfile();
  const upsertMutation = useUpsertBillingProfile();
  const profile = profileQuery.data ?? null;
  const hasProfile = Boolean(profile);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await upsertMutation.mutateAsync({
      pix_key: nullable(formData.get("pix_key")),
      pix_key_type: nullable(formData.get("pix_key_type")),
      recipient_document: nullable(formData.get("recipient_document")),
      recipient_name: nullable(formData.get("recipient_name")),
    });
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner label="Carregando dados de recebimento..." />
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <Alert variant="destructive" title="Não foi possível carregar os dados de recebimento">
        <p>{getErrorMessage(profileQuery.error, "Não foi possível carregar os dados de recebimento.")}</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert variant={hasProfile ? "info" : "warning"} title={hasProfile ? "Dados de recebimento configurados" : "Configure seus dados de recebimento"}>
        <p>
          {hasProfile
            ? "Mantenha seus dados de recebimento por Pix sempre atualizados."
            : "Preencha os dados abaixo para configurar o recebimento dos seus pagamentos."}
        </p>
      </Alert>

      {upsertMutation.isSuccess ? (
        <Alert variant="success" title="Dados de recebimento">
          <p>Dados de recebimento salvos com sucesso.</p>
        </Alert>
      ) : null}

      {upsertMutation.error ? (
        <Alert variant="destructive" title="Dados de recebimento">
          <p>{getErrorMessage(upsertMutation.error, "Não foi possível salvar os dados de recebimento.")}</p>
        </Alert>
      ) : null}

      <form
        key={profile ? `profile-${profile.id}-${profile.updated_at}` : "profile-new"}
        className="grid gap-5 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="pix_key">Chave Pix</Label>
          <Input
            id="pix_key"
            name="pix_key"
            placeholder="organizador@email.com"
            defaultValue={profile?.pix_key ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pix_key_type">Tipo da chave Pix</Label>
          <select
            id="pix_key_type"
            name="pix_key_type"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            defaultValue={profile?.pix_key_type ?? "email"}
          >
            {pixKeyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient_document">Documento do recebedor</Label>
          <Input
            id="recipient_document"
            name="recipient_document"
            placeholder="CPF ou CNPJ"
            defaultValue={profile?.recipient_document ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient_name">Nome do recebedor</Label>
          <Input
            id="recipient_name"
            name="recipient_name"
            placeholder="Nome completo ou razão social"
            defaultValue={profile?.recipient_name ?? ""}
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "Salvando..." : hasProfile ? "Salvar alterações" : "Salvar dados"}
          </Button>
        </div>
      </form>

      {profile ? (
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-slate-500">Situação dos recebimentos</p>
            <div className="mt-1">
              <Badge variant={profile.billing_status === "active" ? "success" : "warning"}>
                {billingStatusLabels[profile.billing_status] ?? "Indisponível"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-slate-500">Plano atual</p>
            <p className="mt-1 font-medium text-slate-950">{getPlanLabel(profile.current_plan)}</p>
          </div>

          <div>
            <p className="text-slate-500">Criado em</p>
            <p className="mt-1 font-medium text-slate-950">{formatDate(profile.created_at)}</p>
          </div>

          <div>
            <p className="text-slate-500">Atualizado em</p>
            <p className="mt-1 font-medium text-slate-950">{formatDate(profile.updated_at)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
