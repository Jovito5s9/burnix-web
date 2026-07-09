"use client";

import { useMemo, useState, type FormEvent } from "react";

import { DynamicRegistrationFields } from "@/components/public/dynamic-registration-fields";
import { PixPaymentBox } from "@/components/public/pix-payment-box";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getApiFieldErrors,
  getErrorMessage,
  type ApiFieldErrors,
} from "@/lib/get-error-message";
import { useCreatePublicRegistration, useCreatePublicRegistrationPix } from "@/hooks/usePublicRegistration";
import type { ContractFormField } from "@/types/form-field";
import type { PaymentPixResponse } from "@/types/payment";
import type { PublicRegistrationPayload, Registration } from "@/types/registration";

type RegistrationFormProps = {
  contractId: string | number;
  fields: ContractFormField[];
};

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeAge(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const numberValue = Number(text);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function RegistrationForm({ contractId, fields }: RegistrationFormProps) {
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order || a.id - b.id),
    [fields]
  );
  const createRegistration = useCreatePublicRegistration(contractId);
  const createPix = useCreatePublicRegistrationPix();

  const [extraFields, setExtraFields] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [pixResult, setPixResult] = useState<PaymentPixResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setFieldErrors({});
    setPixResult(null);
    setRegistration(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = normalizeOptionalText(formData.get("email"));
    const phone = normalizeOptionalText(formData.get("phone"));
    const document = normalizeOptionalText(formData.get("document"));
    const sex = normalizeOptionalText(formData.get("sex"));
    const age = normalizeAge(formData.get("age"));

    if (!email) {
      setFieldErrors({ email: "Informe um e-mail para receber e gerar o Pix da inscrição." });
      setFeedback("Informe um e-mail válido para concluir a inscrição.");
      return;
    }

    const extraPayload = Object.fromEntries(
      Object.entries(extraFields).filter(([, value]) => hasValue(value))
    );

    const payload: PublicRegistrationPayload = {
      name,
      email,
      phone,
      document,
      sex,
      age,
      extra_fields: Object.keys(extraPayload).length > 0 ? extraPayload : {},
    };

    try {
      const createdRegistration = await createRegistration.mutateAsync(payload);
      setRegistration(createdRegistration);
      setFeedback("Inscrição criada com sucesso. Gerando cobrança Pix...");

      const result = await createPix.mutateAsync({
        clientId: createdRegistration.id,
        payload: {
          payer_email: email ?? undefined,
          payer_name: name,
          payer_document: document ?? undefined,
        },
      });

      setPixResult(result);
      setFeedback("Inscrição criada e Pix gerado com sucesso.");
    } catch (error) {
      setFieldErrors(getApiFieldErrors(error));
      setFeedback(
        getErrorMessage(error, "Não foi possível concluir a inscrição pública.")
      );
    }
  }

  const isPending = createRegistration.isPending || createPix.isPending;

  return (
    <div className="space-y-6">
      {feedback ? (
        <Alert
          variant={feedback.includes("sucesso") ? "success" : "warning"}
          title="Inscrição"
        >
          <p>{feedback}</p>
        </Alert>
      ) : null}

      {registration ? (
        <Alert variant="info" title="Inscrição registrada">
          <p>
            Sua inscrição #{registration.id} foi criada com status {registration.registration_status}.
          </p>
        </Alert>
      ) : null}

      {pixResult ? <PixPaymentBox result={pixResult} /> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              Nome completo <span className="text-red-600">*</span>
            </Label>
            <Input id="name" name="name" placeholder="Seu nome" required />
            {fieldErrors.name ? (
              <p className="text-xs font-medium text-red-600">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              E-mail <span className="text-red-600">*</span>
            </Label>
            <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
            {fieldErrors.email ? (
              <p className="text-xs font-medium text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" placeholder="+5591999999999" />
            {fieldErrors.phone ? (
              <p className="text-xs font-medium text-red-600">{fieldErrors.phone}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Documento</Label>
            <Input id="document" name="document" placeholder="CPF/CNPJ" />
            {fieldErrors.document ? (
              <p className="text-xs font-medium text-red-600">{fieldErrors.document}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">Sexo</Label>
            <Input id="sex" name="sex" placeholder="F, M ou outro" />
            {fieldErrors.sex ? (
              <p className="text-xs font-medium text-red-600">{fieldErrors.sex}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Idade</Label>
            <Input id="age" name="age" inputMode="numeric" type="number" min={0} />
            {fieldErrors.age ? (
              <p className="text-xs font-medium text-red-600">{fieldErrors.age}</p>
            ) : null}
          </div>
        </div>

        <DynamicRegistrationFields
          fields={sortedFields}
          values={extraFields}
          fieldErrors={fieldErrors}
          onChange={(fieldKey, value) => {
            setExtraFields((current) => ({ ...current, [fieldKey]: value }));
            setFieldErrors((current) => {
              const next = { ...current };
              delete next[fieldKey];
              delete next[`extra_fields.${fieldKey}`];
              return next;
            });
          }}
        />

        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Processando inscrição..." : "Enviar inscrição e gerar Pix"}
        </Button>
      </form>
    </div>
  );
}
