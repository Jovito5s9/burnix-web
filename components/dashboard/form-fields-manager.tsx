"use client";

import { useState } from "react";

import { FormFieldEditor } from "@/components/dashboard/form-field-editor";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteFormField, useFormFields } from "@/hooks/useFormFields";
import { getErrorMessage } from "@/lib/get-error-message";
import type { ContractFormField } from "@/types/form-field";

type FormFieldsManagerProps = {
  contractId: string | number;
};

const fieldTypeLabels: Record<string, string> = {
  text: "Texto curto",
  email: "E-mail",
  number: "Número",
  date: "Data",
  select: "Lista de opções",
  radio: "Escolha única",
  checkbox: "Caixas de seleção",
  multiselect: "Múltiplas opções",
};

function summarizeOptions(options: ContractFormField["options"]) {
  if (!options) return "Sem opções";
  if (Array.isArray(options)) return `${options.length} opção(ões)`;

  const count = [options.items, options.options, options.values].find(Array.isArray)?.length;
  return count ? `${count} opção(ões)` : "Opções configuradas";
}

export function FormFieldsManager({ contractId }: FormFieldsManagerProps) {
  const fieldsQuery = useFormFields(contractId);
  const deleteMutation = useDeleteFormField(contractId);
  const [editingField, setEditingField] = useState<ContractFormField | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fields = [...(fieldsQuery.data ?? [])].sort(
    (a, b) => a.order - b.order || a.id - b.id
  );

  async function handleDelete(field: ContractFormField) {
    setFeedback(null);

    if (field.is_system) {
      setFeedback("Os campos padrão não podem ser removidos.");
      return;
    }

    try {
      await deleteMutation.mutateAsync(field.id);
      if (editingField?.id === field.id) setEditingField(null);
      setFeedback("Campo removido com sucesso.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Não foi possível remover o campo."));
    }
  }

  return (
    <div className="space-y-6">
      {feedback ? (
        <Alert variant={feedback.includes("sucesso") ? "success" : "warning"} title="Campos do formulário">
          <p>{feedback}</p>
        </Alert>
      ) : null}

      {fieldsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner label="Carregando campos..." />
        </div>
      ) : null}

      {fieldsQuery.error ? (
        <Alert variant="warning" title="Campos indisponíveis">
          <p>{getErrorMessage(fieldsQuery.error, "Não foi possível carregar os campos do formulário.")}</p>
        </Alert>
      ) : null}

      {fields.length === 0 && !fieldsQuery.isLoading ? (
        <EmptyState
          title="Nenhum campo adicional"
          description="Crie campos dinâmicos para complementar o formulário público de inscrição."
        />
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <article
              key={field.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{field.label}</p>
                    {field.required ? <Badge variant="warning">Obrigatório</Badge> : null}
                    {field.is_system ? <Badge variant="outline">Campo padrão</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Tipo: {fieldTypeLabels[field.type] ?? "Outro"} · posição {field.order}
                  </p>
                  <p className="text-xs text-slate-500">
                    {summarizeOptions(field.options)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingField(field)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deleteMutation.isPending || field.is_system}
                    onClick={() => handleDelete(field)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <p className="font-medium text-slate-950">
            {editingField ? "Editar campo" : "Novo campo"}
          </p>
          <p className="text-sm text-slate-500">
            Escolha o tipo de resposta e configure as opções disponíveis para o participante.
          </p>
        </div>
        <FormFieldEditor
          key={editingField?.id ?? "new-field"}
          contractId={contractId}
          field={editingField}
          onCancelEdit={() => setEditingField(null)}
        />
      </div>
    </div>
  );
}
