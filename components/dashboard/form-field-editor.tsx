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
  "text",
  "email",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "multiselect",
] as const;

type FormFieldEditorProps = {
  contractId: string | number;
  field?: ContractFormField | null;
  onCancelEdit?: () => void;
};

function stringifyOptions(options: ContractFormField["options"]) {
  if (!options) return "";
  if (Array.isArray(options)) {
    return options
      .map((option) => {
        if (typeof option === "string" || typeof option === "number") {
          return String(option);
        }
        if (option && typeof option === "object") {
          const record = option as Record<string, unknown>;
          return String(record.value ?? record.label ?? "");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return JSON.stringify(options, null, 2);
}

function parseOptions(value: string) {
  const text = value.trim();
  if (!text) return null;

  if (text.startsWith("{") || text.startsWith("[")) {
    return JSON.parse(text) as unknown[] | Record<string, unknown>;
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((item) => ({ label: item, value: item }));
}

function parseValidationRules(value: string) {
  const text = value.trim();
  if (!text) return null;
  return JSON.parse(text) as Record<string, unknown>;
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
  const [fieldKey, setFieldKey] = useState(field?.field_key ?? "");
  const [type, setType] = useState(field?.type ?? "text");
  const [required, setRequired] = useState(field?.required ?? false);
  const [order, setOrder] = useState(String(field?.order ?? 0));
  const [options, setOptions] = useState(stringifyOptions(field?.options ?? null));
  const [validationRules, setValidationRules] = useState(
    field?.validation_rules ? JSON.stringify(field.validation_rules, null, 2) : ""
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const normalizedLabel = label.trim();
    const normalizedKey = fieldKey.trim() || defaultFieldKey(normalizedLabel);

    if (!normalizedLabel || !normalizedKey) {
      setFeedback("Informe label e field_key para salvar o campo.");
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
        validation_rules: parseValidationRules(validationRules),
      };

      if (field) {
        await updateMutation.mutateAsync({ fieldId: field.id, payload });
        setFeedback("Campo atualizado com sucesso.");
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback("Campo criado com sucesso.");
        setLabel("");
        setFieldKey("");
        setType("text");
        setRequired(false);
        setOrder("0");
        setOptions("");
        setValidationRules("");
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
        <Alert variant={feedback.includes("sucesso") ? "success" : "warning"} title="Campo">
          <p>{feedback}</p>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="field_label">Label</Label>
          <Input
            id="field_label"
            value={label}
            placeholder="Tamanho da camiseta"
            onChange={(event) => {
              setLabel(event.target.value);
              if (!fieldKey) setFieldKey(defaultFieldKey(event.target.value));
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_key">Field key</Label>
          <Input
            id="field_key"
            value={fieldKey}
            placeholder="camiseta"
            onChange={(event) => setFieldKey(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_type">Tipo</Label>
          <select
            id="field_type"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {fieldTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_order">Ordem</Label>
          <Input
            id="field_order"
            type="number"
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
        <span>Campo obrigatório</span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="field_options">Opções</Label>
        <textarea
          id="field_options"
          className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          value={options}
          placeholder={'Uma opção por linha, ou JSON. Ex.:\nP\nM\nG'}
          disabled={!needsOptions}
          onChange={(event) => setOptions(event.target.value)}
        />
        <p className="text-xs text-slate-500">
          Usado para select, radio, checkbox e multiselect. Aceita linhas simples ou JSON.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field_validation">Validation rules JSON</Label>
        <textarea
          id="field_validation"
          className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          value={validationRules}
          placeholder='{"help":"Escolha um tamanho"}'
          onChange={(event) => setValidationRules(event.target.value)}
        />
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
