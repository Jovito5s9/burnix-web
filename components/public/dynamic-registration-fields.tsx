"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiFieldErrors } from "@/lib/get-error-message";
import type { ContractFormField } from "@/types/form-field";

type DynamicRegistrationFieldsProps = {
  fields: ContractFormField[];
  values: Record<string, unknown>;
  fieldErrors?: ApiFieldErrors;
  onChange: (fieldKey: string, value: unknown) => void;
};

type Option = {
  label: string;
  value: string;
};

function getOptions(options: ContractFormField["options"]): Option[] {
  if (!options) return [];

  const rawOptions = Array.isArray(options)
    ? options
    : Array.isArray(options.items)
      ? options.items
      : Array.isArray(options.options)
        ? options.options
        : Array.isArray(options.values)
          ? options.values
          : [];

  return rawOptions
    .map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return { label: String(option), value: String(option) };
      }

      if (option && typeof option === "object") {
        const record = option as Record<string, unknown>;
        const value = record.value ?? record.id ?? record.label;
        const label = record.label ?? record.name ?? value;

        if (value !== undefined && label !== undefined) {
          return { label: String(label), value: String(value) };
        }
      }

      return null;
    })
    .filter((option): option is Option => option !== null);
}

function getHelpText(field: ContractFormField) {
  const help = field.validation_rules?.help;
  return typeof help === "string" ? help : null;
}

function getFieldError(fieldKey: string, fieldErrors?: ApiFieldErrors) {
  return fieldErrors?.[fieldKey] ?? fieldErrors?.[`extra_fields.${fieldKey}`] ?? null;
}

export function DynamicRegistrationFields({
  fields,
  values,
  fieldErrors = {},
  onChange,
}: DynamicRegistrationFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="font-medium text-slate-950">Campos adicionais</p>
        <p className="text-sm text-slate-500">
          Estes campos são definidos pelo organizador do evento.
        </p>
      </div>

      {fields.map((field) => {
        const type = field.type.toLowerCase();
        const options = getOptions(field.options);
        const value = values[field.field_key];
        const error = getFieldError(field.field_key, fieldErrors);
        const helpText = getHelpText(field);
        const commonLabel = (
          <Label htmlFor={`extra_${field.field_key}`}>
            {field.label}
            {field.required ? <span className="text-red-600"> *</span> : null}
          </Label>
        );

        return (
          <div key={field.id} className="space-y-2">
            {commonLabel}

            {type === "select" ? (
              <select
                id={`extra_${field.field_key}`}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                required={field.required}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(field.field_key, event.target.value)}
              >
                <option value="">Selecione uma opção</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : type === "radio" ? (
              <div className="space-y-2">
                {options.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={`extra_${field.field_key}`}
                      required={field.required}
                      checked={value === option.value}
                      onChange={() => onChange(field.field_key, option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : type === "checkbox" ? (
              options.length > 0 ? (
                <div className="space-y-2">
                  {options.map((option) => {
                    const selectedValues = Array.isArray(value) ? value.map(String) : [];
                    const checked = selectedValues.includes(option.value);

                    return (
                      <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...selectedValues, option.value]
                              : selectedValues.filter((item) => item !== option.value);
                            onChange(field.field_key, next);
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    id={`extra_${field.field_key}`}
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => onChange(field.field_key, event.target.checked)}
                  />
                  <span>Sim</span>
                </label>
              )
            ) : type === "multiselect" ? (
              <select
                id={`extra_${field.field_key}`}
                className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                multiple
                value={Array.isArray(value) ? value.map(String) : []}
                onChange={(event) => {
                  const selected = Array.from(event.currentTarget.selectedOptions).map(
                    (option) => option.value
                  );
                  onChange(field.field_key, selected);
                }}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={`extra_${field.field_key}`}
                type={type === "email" || type === "number" || type === "date" ? type : "text"}
                required={field.required}
                value={typeof value === "string" || typeof value === "number" ? value : ""}
                onChange={(event) => {
                  const nextValue = type === "number" && event.target.value !== ""
                    ? Number(event.target.value)
                    : event.target.value;
                  onChange(field.field_key, nextValue);
                }}
              />
            )}

            {helpText ? <p className="text-xs text-slate-500">{helpText}</p> : null}
            {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
