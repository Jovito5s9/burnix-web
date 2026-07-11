"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DynamicRegistrationFields } from "@/components/public/dynamic-registration-fields";
import { PixPaymentBox } from "@/components/public/pix-payment-box";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import {
  useCreateParticipantRegistration,
  useCreateParticipantRegistrationPix,
} from "@/hooks/usePublicRegistration";
import {
  ApiClientError,
  getApiFieldErrors,
  getErrorMessage,
  type ApiFieldErrors,
} from "@/lib/get-error-message";
import type { ContractFormField } from "@/types/form-field";
import type { ParticipantRegistrationDetail } from "@/types/participant";
import type { PublicPaymentRead } from "@/types/payment";

type RegistrationFormProps = {
  contractId: string | number;
  fields: ContractFormField[];
  requiresPayment: boolean;
};

type Feedback = {
  variant: "info" | "success" | "warning" | "destructive";
  title: string;
  message: string;
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

export function RegistrationForm({
  contractId,
  fields,
  requiresPayment,
}: RegistrationFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    participant,
    isLoadingParticipant,
  } = useParticipantAuth();
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order || a.id - b.id),
    [fields]
  );
  const createRegistration = useCreateParticipantRegistration(contractId);
  const createPix = useCreateParticipantRegistrationPix();

  const [extraFields, setExtraFields] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [registration, setRegistration] =
    useState<ParticipantRegistrationDetail | null>(null);
  const [pixResult, setPixResult] = useState<PublicPaymentRead | null>(null);

  function redirectToParticipantLogin() {
    router.push(
      `/participante/entrar?next=${encodeURIComponent(pathname || `/eventos/${contractId}`)}`
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setFieldErrors({});
    setPixResult(null);
    setRegistration(null);

    if (!participant) {
      redirectToParticipantLogin();
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = normalizeOptionalText(formData.get("phone"));
    const document = normalizeOptionalText(formData.get("document"));
    const sex = normalizeOptionalText(formData.get("sex"));
    const age = normalizeAge(formData.get("age"));

    const extraPayload = Object.fromEntries(
      Object.entries(extraFields).filter(([, value]) => hasValue(value))
    );

    try {
      const createdRegistration = await createRegistration.mutateAsync({
        name,
        phone,
        document,
        sex,
        age,
        extra_fields: extraPayload,
      });
      setRegistration(createdRegistration);

      if (!requiresPayment || createdRegistration.payment_status === "not_required") {
        setFeedback({
          variant: "success",
          title: "Inscrição confirmada",
          message: "Sua inscrição foi confirmada. Este evento não exige pagamento.",
        });
        event.currentTarget.reset();
        setExtraFields({});
        return;
      }

      setFeedback({
        variant: "info",
        title: "Inscrição criada",
        message: "Sua inscrição foi criada. Estamos gerando a cobrança Pix.",
      });

      const payment = await createPix.mutateAsync({
        registrationId: createdRegistration.id,
      });

      if (payment.status === "not_required") {
        setFeedback({
          variant: "success",
          title: "Inscrição confirmada",
          message: payment.message,
        });
      } else {
        setPixResult(payment);
        setFeedback({
          variant: "success",
          title: "Pix gerado",
          message: "Inscrição criada e pagamento Pix disponibilizado com sucesso.",
        });
      }

      event.currentTarget.reset();
      setExtraFields({});
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        redirectToParticipantLogin();
        return;
      }

      setFieldErrors(getApiFieldErrors(error));
      setFeedback({
        variant: "destructive",
        title: "Não foi possível concluir a inscrição",
        message: getErrorMessage(
          error,
          "Não foi possível concluir a inscrição. Tente novamente."
        ),
      });
    }
  }

  if (isLoadingParticipant) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner label="Verificando sua sessão de participante..." />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="space-y-4">
        <Alert variant="info" title="Entre para se inscrever">
          <p>
            O evento continua público, mas a inscrição precisa estar vinculada à sua conta de participante.
          </p>
        </Alert>
        <Button className="w-full" onClick={redirectToParticipantLogin}>
          Inscrever-se
        </Button>
        <p className="text-center text-xs text-slate-500">
          Sua sessão de participante é separada da sessão do organizador.
        </p>
      </div>
    );
  }

  const isPending = createRegistration.isPending || createPix.isPending;

  return (
    <div className="space-y-6">
      <Alert variant="info" title="Participante autenticado">
        <p>
          A inscrição será vinculada a <strong>{participant.email}</strong>. O e-mail e a identidade não são enviados pelo formulário.
        </p>
      </Alert>

      {feedback ? (
        <Alert variant={feedback.variant} title={feedback.title}>
          <p>{feedback.message}</p>
        </Alert>
      ) : null}

      {registration ? (
        <Alert variant="info" title="Inscrição registrada">
          <p>
            Inscrição #{registration.id} · Status {registration.registration_status} · Pagamento {registration.payment_status}.
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
            <Input id="age" name="age" inputMode="numeric" type="number" min={0} max={130} />
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
          {isPending
            ? "Processando inscrição..."
            : requiresPayment
              ? "Enviar inscrição e gerar Pix"
              : "Confirmar inscrição gratuita"}
        </Button>
      </form>
    </div>
  );
}
