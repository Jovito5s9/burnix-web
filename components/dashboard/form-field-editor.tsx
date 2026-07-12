"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateFormField,
  useUpdateFormField,
} from "@/hooks/useFormFields";
import { getErrorMessage } from "@/lib/get-error-message";
import type {
  ContractFormField,
  ContractFormFieldPayload,
} from "@/types/form-field";

const fieldTypes = [
  { value: "text", label: "Texto curto" },
  { value: "email", label: "E-mail" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Lista de opções" },
  { value: "radio", label: "Escolha única" },
  { value: "checkbox", label: "Caixas de seleção" },
  { value: "multiselect", label: "Múltiplas opções" },
] as const;

type FormFieldEditorProps = {
  contractId: string | number;
  field?: ContractFormField | null;
  onCancelEdit?: () => void;
};

function extractOptionValues(options: ContractFormField["options"]): string[] {
  if (!options) return [];

  const source = Array.isArray(options)
    ? options
    : [options.items, options.options, options.values].find(Array.isArray) ?? [];

  return source
    .map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return String(option);
      }

      if (option && typeof option === "object") {
        const record = option as Record<string, unknown>;
        return String(record.label ?? record.value ?? "");
      }

      return "";
    })
    .filter(Boolean);
}

function stringifyOptions(options: ContractFormField["options"]) {
  return extractOptionValues(options).join("\n");
}

function parseOptions(value: string) {
  const items = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return items.length > 0
    ? items.map((item) => ({ label: item, value: item }))
    : null;
}

function defaultFieldKey(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function FormFieldEditor({
  contractId,
  field,
  onCancelEdit,
}: FormFieldEditorProps) {
  const createMutation = useCreateFormField(contractId);
  const updateMutation = useUpdateFormField(contractId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [label, setLabel] = useState(field?.label ?? "");
  const [type, setType] = useState(field?.type ?? "text");
  const [required, setRequired] = useState(field?.required ?? false);
  const [order, setOrder] = useState(String(field?.order ?? 0));
  const [options, setOptions] = useState(stringifyOptions(field?.options ?? null));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const normalizedLabel = label.trim();
    const normalizedKey = field?.field_key ?? defaultFieldKey(normalizedLabel);

    if (!normalizedLabel || !normalizedKey) {
      setFeedback("Informe o nome da pergunta para continuar.");
      return;
    }

    try {
      const payload: ContractFormFieldPayload = {
        label: normalizedLabel,
        field_key: normalizedKey,
        type,
        required,
        order: Number(order) || 0,
        options: parseOptions(options),
        validation_rules: field?.validation_rules ?? null,
      };

      if (field) {
        await updateMutation.mutateAsync({ fieldId: field.id, payload });
        setFeedback("Campo atualizado com sucesso.");
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback("Campo criado com sucesso.");
        setLabel("");
        setType("text");
        setRequired(false);
        setOrder("0");
        setOptions("");
      }
    } catch (error) {
      setFeedback(getErrorMessage(error, "Não foi possível salvar o campo."));
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const needsOptions = ["select", "radio", "checkbox", "multiselect"].includes(type);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {feedback ? (
        <Alert variant={feedback.includes("sucesso") ? "success" : "warning"} title="Campo do formulário">
          <p>{feedback}</p>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="field_label">Pergunta</Label>
          <Input
            id="field_label"
            value={label}
            placeholder="Ex.: Qual é o tamanho da sua camiseta?"
            onChange={(event) => setLabel(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_type">Tipo de resposta</Label>
          <select
            id="field_type"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {fieldTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_order">Posição no formulário</Label>
          <Input
            id="field_order"
            type="number"
            min="0"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
        />
        <span>Resposta obrigatória</span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="field_options">Opções de resposta</Label>
        <textarea
          id="field_options"
          className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          value={options}
          placeholder={'Digite uma opção por linha. Ex.:\nP\nM\nG'}
          disabled={!needsOptions}
          onChange={(event) => setOptions(event.target.value)}
        />
        <p className="text-xs text-slate-500">
          Este campo é habilitado para tipos de resposta com opções predefinidas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : field ? "Atualizar campo" : "Criar campo"}
        </Button>
        {field ? (
          <Button type="button" variant="secondary" onClick={onCancelEdit}>
            Cancelar edição
          </Button>
        ) : null}
      </div>
    </form>
  );
}
