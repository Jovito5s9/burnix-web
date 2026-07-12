"use client";

import { useId, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  compareLocalDateTimes,
  toApiLocalDateTime,
  toDateTimeLocalValue,
} from "@/lib/datetime";
import {
  ApiClientError,
  getErrorMessage
} from "@/lib/get-error-message";
import type {
  Contract,
  ContractCreatePayload,
  ContractUpdatePayload,
} from "@/types/contract";

type EventFormProps = {
  mode: "create" | "edit";
  contract?: Contract;
  financialLocked?: boolean;
  isSubmitting?: boolean;
  onSubmit: (
    payload: ContractCreatePayload | ContractUpdatePayload
  ) => Promise<void>;
  onCancel?: () => void;
  onVersionConflict?: () => void | Promise<void>;
};

type EventFormField =
  | "title"
  | "description"
  | "status"
  | "price"
  | "currency"
  | "capacity"
  | "start_at"
  | "end_at"
  | "registration_deadline"
  | "timezone";

type EventFormErrors = Partial<Record<EventFormField, string>>;

const textareaClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100";
const selectClassName =
  "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100";

function nullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const raw = nullableString(value);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeFieldName(value: string): EventFormField | null {
  const name = value.split(".").at(-1);
  const aliases: Record<string, EventFormField> = {
    start_date: "start_at",
    end_date: "end_at",
  };
  const normalized = aliases[name ?? ""] ?? name;

  return [
    "title",
    "description",
    "status",
    "price",
    "currency",
    "capacity",
    "start_at",
    "end_at",
    "registration_deadline",
    "timezone",
  ].includes(normalized ?? "")
    ? (normalized as EventFormField)
    : null;
}

function getApiFormErrors(error: unknown): EventFormErrors {
  if (!(error instanceof ApiClientError)) return {};

  const errors: EventFormErrors = {};
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    const normalized = normalizeFieldName(field);
    if (normalized) errors[normalized] = message;
  }

  const detailField =
    typeof error.detail?.field === "string"
      ? normalizeFieldName(error.detail.field)
      : null;
  if (detailField && !errors[detailField]) {
    errors[detailField] = error.message;
  }

  const missingFields = Array.isArray(error.detail?.missing_fields)
    ? error.detail.missing_fields
    : [];
  for (const field of missingFields) {
    if (typeof field !== "string") continue;
    const normalized = normalizeFieldName(field);
    if (normalized) errors[normalized] = "Este campo é obrigatório para publicar.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs font-medium text-red-700" role="alert">
      {message}
    </p>
  ) : null;
}

function getInitialDateTime(
  preciseValue: string | null | undefined,
  legacyValue: string | null | undefined,
  timezone: string,
  endOfDay = false
) {
  if (preciseValue) return toDateTimeLocalValue(preciseValue, timezone);
  if (!legacyValue) return "";
  return `${legacyValue}T${endOfDay ? "23:59" : "00:00"}`;
}

export function EventForm({
  mode,
  contract,
  financialLocked = false,
  isSubmitting = false,
  onSubmit,
  onCancel,
  onVersionConflict,
}: EventFormProps) {
  const id = useId();
  const timezone = contract?.timezone ?? "America/Belem";
  const [fieldErrors, setFieldErrors] = useState<EventFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const title = nullableString(formData.get("title"));
    const description = nullableString(formData.get("description"));
    const price = nullableString(formData.get("price")) ?? "0.00";
    const capacity = nullableNumber(formData.get("capacity"));
    const startAt = toApiLocalDateTime(formData.get("start_at"));
    const endAt = toApiLocalDateTime(formData.get("end_at"));
    const registrationDeadline = toApiLocalDateTime(
      formData.get("registration_deadline")
    );
    const eventTimezone =
      nullableString(formData.get("timezone")) ?? "America/Belem";

    const errors: EventFormErrors = {};
    if (!title) errors.title = "Informe o título do evento.";
    if (Number.isNaN(capacity)) {
      errors.capacity = "Informe uma capacidade válida.";
    } else if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
      errors.capacity = "A capacidade deve ser um número inteiro igual ou maior que zero.";
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      errors.price = "O preço deve ser igual ou maior que zero.";
    }

    const endVsStart = compareLocalDateTimes(endAt, startAt);
    if (endVsStart !== null && endVsStart <= 0) {
      errors.end_at = "O término deve ser posterior ao início do evento.";
    }

    const deadlineVsStart = compareLocalDateTimes(
      registrationDeadline,
      startAt
    );
    if (deadlineVsStart !== null && deadlineVsStart > 0) {
      errors.registration_deadline =
        "O prazo de inscrição deve ser igual ou anterior ao início.";
    }

    const requestedStatus = nullableString(formData.get("status"));
    if (mode === "create" && requestedStatus === "published") {
      if (!startAt) errors.start_at = "Informe o início para publicar o evento.";
      if (!endAt) errors.end_at = "Informe o término para publicar o evento.";
    }

    if (Object.keys(errors).length > 0 || !title) {
      setFieldErrors(errors);
      setFormError("Revise os campos destacados antes de continuar.");
      return;
    }

    const common = {
      title,
      description,
      capacity,
      start_at: startAt,
      end_at: endAt,
      registration_deadline: registrationDeadline,
      timezone: eventTimezone,
    };

    const payload: ContractCreatePayload | ContractUpdatePayload =
      mode === "create"
        ? {
            ...common,
            status: requestedStatus === "published" ? "published" : "draft",
            price,
            currency: "BRL",
            payment_config: null,
          }
        : {
            ...common,
            version: contract?.version ?? 1,
            ...(!financialLocked ? { price, currency: "BRL" as const } : {}),
          };

    try {
      await onSubmit(payload);
    } catch (error) {
      setFieldErrors(getApiFormErrors(error));
      setFormError(getErrorMessage(error, "Não foi possível salvar o evento."));

      if (
        error instanceof ApiClientError &&
        error.code === "event_version_conflict"
      ) {
        await onVersionConflict?.();
      }
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div className="md:col-span-2">
          <Alert variant="warning" title="Não foi possível salvar">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${id}-title`}>Título</Label>
        <Input
          id={`${id}-title`}
          name="title"
          defaultValue={contract?.title ?? ""}
          placeholder="Nome do evento"
          aria-invalid={Boolean(fieldErrors.title)}
          required
        />
        <FieldError message={fieldErrors.title} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${id}-description`}>Descrição</Label>
        <textarea
          id={`${id}-description`}
          name="description"
          rows={4}
          className={textareaClassName}
          defaultValue={contract?.description ?? ""}
          placeholder="Descrição que será apresentada aos participantes"
          aria-invalid={Boolean(fieldErrors.description)}
        />
        <FieldError message={fieldErrors.description} />
      </div>

      {mode === "create" ? (
        <div className="space-y-2">
          <Label htmlFor={`${id}-status`}>Situação inicial</Label>
          <select
            id={`${id}-status`}
            name="status"
            defaultValue="draft"
            className={selectClassName}
          >
            <option value="draft">Salvar como rascunho</option>
            <option value="published">Criar e publicar</option>
          </select>
          <p className="text-xs text-slate-500">
            Eventos publicados precisam ter início e término válidos.
          </p>
          <FieldError message={fieldErrors.status} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Status atual</Label>
          <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
            O status é alterado pelas ações da tela de detalhe.
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${id}-capacity`}>Capacidade</Label>
        <Input
          id={`${id}-capacity`}
          name="capacity"
          type="number"
          min="0"
          step="1"
          defaultValue={contract?.capacity ?? ""}
          placeholder="Sem limite"
          aria-invalid={Boolean(fieldErrors.capacity)}
        />
        <FieldError message={fieldErrors.capacity} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-price`}>Preço</Label>
        <Input
          id={`${id}-price`}
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={contract?.price ?? "0.00"}
          disabled={financialLocked}
          aria-invalid={Boolean(fieldErrors.price)}
        />
        <FieldError message={fieldErrors.price} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-currency`}>Moeda</Label>
        <Input
          id={`${id}-currency`}
          name="currency"
          value="BRL"
          readOnly
          disabled={financialLocked}
          aria-invalid={Boolean(fieldErrors.currency)}
        />
        <FieldError message={fieldErrors.currency} />
      </div>

      {financialLocked ? (
        <div className="md:col-span-2">
          <Alert variant="info" title="Dados financeiros protegidos">
            <p>
              Preço e moeda não podem ser alterados porque este evento já possui
              inscrição ou pagamento. Essa proteção também é aplicada pelo backend.
            </p>
          </Alert>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${id}-timezone`}>Fuso horário</Label>
        <Input
          id={`${id}-timezone`}
          name="timezone"
          defaultValue={timezone}
          list={`${id}-timezones`}
          aria-invalid={Boolean(fieldErrors.timezone)}
        />
        <datalist id={`${id}-timezones`}>
          <option value="America/Belem" />
          <option value="America/Fortaleza" />
          <option value="America/Recife" />
          <option value="America/Manaus" />
          <option value="America/Cuiaba" />
          <option value="America/Sao_Paulo" />
          <option value="America/Rio_Branco" />
        </datalist>
        <p className="text-xs text-slate-500">Use um identificador IANA.</p>
        <FieldError message={fieldErrors.timezone} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-start-at`}>Início</Label>
        <Input
          id={`${id}-start-at`}
          name="start_at"
          type="datetime-local"
          defaultValue={getInitialDateTime(
            contract?.start_at,
            contract?.start_date,
            timezone
          )}
          aria-invalid={Boolean(fieldErrors.start_at)}
        />
        <FieldError message={fieldErrors.start_at} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-end-at`}>Fim</Label>
        <Input
          id={`${id}-end-at`}
          name="end_at"
          type="datetime-local"
          defaultValue={getInitialDateTime(
            contract?.end_at,
            contract?.end_date,
            timezone,
            true
          )}
          aria-invalid={Boolean(fieldErrors.end_at)}
        />
        <FieldError message={fieldErrors.end_at} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${id}-registration-deadline`}>Prazo de inscrição</Label>
        <Input
          id={`${id}-registration-deadline`}
          name="registration_deadline"
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(
            contract?.registration_deadline,
            timezone
          )}
          aria-invalid={Boolean(fieldErrors.registration_deadline)}
        />
        <p className="text-xs text-slate-500">
          Deve ser igual ou anterior ao início do evento.
        </p>
        <FieldError message={fieldErrors.registration_deadline} />
      </div>

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando..."
            : mode === "create"
              ? "Criar evento"
              : "Salvar alterações"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
