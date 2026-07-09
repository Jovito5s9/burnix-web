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
        <Spinner label="Carregando perfil de cobrança..." />
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <Alert variant="destructive" title="Erro ao carregar perfil de cobrança">
        <p>{getErrorMessage(profileQuery.error, "Não foi possível carregar o perfil de cobrança.")}</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert variant={hasProfile ? "info" : "warning"} title={hasProfile ? "Perfil encontrado" : "Perfil ainda não criado"}>
        <p>
          {hasProfile
            ? "Atualize os dados Pix usados pelo backend para repasses e cobrança do organizador."
            : "O backend retornou 404 para /billing-profiles/me. Preencha os dados abaixo e salve para criar o perfil via PUT /billing-profiles/me."}
        </p>
      </Alert>

      {upsertMutation.isSuccess ? (
        <Alert variant="success" title="Perfil de cobrança">
          <p>Perfil de cobrança salvo com sucesso.</p>
        </Alert>
      ) : null}

      {upsertMutation.error ? (
        <Alert variant="destructive" title="Perfil de cobrança">
          <p>{getErrorMessage(upsertMutation.error, "Não foi possível salvar o perfil de cobrança.")}</p>
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
            {upsertMutation.isPending ? "Salvando..." : hasProfile ? "Atualizar perfil" : "Criar perfil"}
          </Button>
        </div>
      </form>

      {profile ? (
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-slate-500">Status de cobrança</p>
            <div className="mt-1">
              <Badge variant={profile.billing_status === "active" ? "success" : "warning"}>
                {billingStatusLabels[profile.billing_status] ?? profile.billing_status}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-slate-500">Plano atual</p>
            <p className="mt-1 font-medium text-slate-950">{profile.current_plan ?? "—"}</p>
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
