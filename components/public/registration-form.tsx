"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";

import { DynamicRegistrationFields } from "@/components/public/dynamic-registration-fields";
import { PixPaymentBox } from "@/components/public/pix-payment-box";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import { useRateLimitCountdown } from "@/hooks/useRateLimitCountdown";
import {
  useCreateParticipantRegistration,
  useCreateParticipantRegistrationPix,
  usePollParticipantRegistrationPayment,
  useRecoverParticipantRegistration,
} from "@/hooks/usePublicRegistration";
import {
  getParticipantPaymentStatusLabel,
  getParticipantRegistrationStatusLabel,
} from "@/lib/format";
import { getRegistrationClosureFromApiCode, type RegistrationClosure } from "@/lib/event-availability";
import {
  ApiClientError,
  getApiErrorCode,
  getApiErrorDetail,
  getApiFieldErrors,
  getErrorMessage,
  isApiNetworkError,
  isApiRateLimitError,
  type ApiFieldErrors,
} from "@/lib/get-error-message";
import type { ContractFormField } from "@/types/form-field";
import type { ParticipantRegistrationDetail } from "@/types/participant-registration";
import type { ParticipantPaymentResponse } from "@/types/payment";
import type {
  RegistrationAlreadyExistsErrorDetail,
  RegistrationRecoveryContext,
} from "@/types/registration";

type RegistrationFormProps = {
  contractId: string | number;
  fields: ContractFormField[];
  requiresPayment: boolean;
  onRegistrationClosed?: (closure: RegistrationClosure) => void;
};

type Feedback = {
  variant: "info" | "success" | "warning" | "destructive";
  title: string;
  message: string;
};

type PaymentAttempt = {
  registrationId: number;
  idempotencyKey: string;
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

function getDuplicateRegistrationDetail(
  error: unknown
): RegistrationAlreadyExistsErrorDetail | null {
  if (getApiErrorCode(error) !== "registration_already_exists") return null;

  const detail = getApiErrorDetail(error);
  if (
    !detail ||
    typeof detail.registration_id !== "number" ||
    typeof detail.can_resume_payment !== "boolean"
  ) {
    return null;
  }

  return {
    code: "registration_already_exists",
    message:
      typeof detail.message === "string"
        ? detail.message
        : "Você já está inscrito neste evento.",
    registration_id: detail.registration_id,
    can_resume_payment: detail.can_resume_payment,
  };
}

export function RegistrationForm({
  contractId,
  fields,
  requiresPayment,
  onRegistrationClosed,
}: RegistrationFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { participant, isLoadingParticipant } = useParticipantAuth();
  const registrationRateLimit = useRateLimitCountdown();
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order || a.id - b.id),
    [fields]
  );
  const createRegistration = useCreateParticipantRegistration(contractId);
  const recoverRegistration = useRecoverParticipantRegistration();
  const createPix = useCreateParticipantRegistrationPix();
  const paymentAttemptRef = useRef<PaymentAttempt | null>(null);
  const registrationSubmissionRef = useRef(false);

  const [extraFields, setExtraFields] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [registration, setRegistration] =
    useState<ParticipantRegistrationDetail | null>(null);
  const [recoveryContext, setRecoveryContext] =
    useState<RegistrationRecoveryContext | null>(null);
  const [paymentResult, setPaymentResult] =
    useState<ParticipantPaymentResponse | null>(null);
  const [paymentError, setPaymentError] = useState<unknown>(null);
  const [recoveryError, setRecoveryError] = useState<unknown>(null);

  const paymentStatusForPolling =
    paymentResult?.status ??
    registration?.latest_payment?.status ??
    registration?.payment_status;
  const shouldPollPayment = Boolean(
    registration && paymentStatusForPolling === "pending"
  );
  const registrationPolling = usePollParticipantRegistrationPayment(
    registration?.id,
    shouldPollPayment
  );
  const currentRegistration = registrationPolling.data ?? registration;


  function redirectToParticipantLogin() {
    router.push(
      `/participante/entrar?next=${encodeURIComponent(pathname || `/eventos/${contractId}`)}`
    );
  }

  function getStablePaymentAttempt(registrationId: number) {
    if (paymentAttemptRef.current?.registrationId === registrationId) {
      return paymentAttemptRef.current;
    }

    const attempt = {
      registrationId,
      idempotencyKey: crypto.randomUUID(),
    };
    paymentAttemptRef.current = attempt;
    return attempt;
  }

  async function loadExistingRegistration(context: RegistrationRecoveryContext) {
    setRecoveryError(null);
    setRecoveryContext(context);

    try {
      const existingRegistration = await recoverRegistration.mutateAsync(
        context.registrationId
      );
      setRegistration(existingRegistration);
      setPaymentResult(null);
      return existingRegistration;
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        redirectToParticipantLogin();
        return null;
      }

      setRecoveryError(error);
      return null;
    }
  }

  async function generatePixForRegistration(registrationId: number) {
    if (createPix.isPending) return;

    setPaymentError(null);
    const paymentAttempt = getStablePaymentAttempt(registrationId);

    try {
      const result = await createPix.mutateAsync({
        registrationId: paymentAttempt.registrationId,
        payload: { idempotency_key: paymentAttempt.idempotencyKey },
      });
      paymentAttemptRef.current = null;
      setPaymentResult(result);

      if (result.status === "not_required") {
        setFeedback({
          variant: "success",
          title: "Este evento é gratuito",
          message: result.message,
        });
      } else if (result.status === "paid") {
        setFeedback({
          variant: "success",
          title: "Pagamento confirmado",
          message: "Sua inscrição já está confirmada para este evento.",
        });
      } else {
        setFeedback({
          variant: "info",
          title: "Aguardando pagamento",
          message: "Use o QR Code ou o código Pix abaixo para concluir o pagamento.",
        });
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        redirectToParticipantLogin();
        return;
      }

      setPaymentError(error);

      if (isApiRateLimitError(error)) {
        return;
      }
      setFeedback({
        variant: "warning",
        title: "Não foi possível gerar o Pix",
        message:
          "Sua inscrição continua salva. Tente gerar um novo Pix abaixo.",
      });

      const context = recoveryContext ?? {
        registrationId,
        canResumePayment: true,
      };

      const refreshedRegistration = await loadExistingRegistration(context);

      // O mesmo UUID permanece durante retries automáticos e também em um
      // retry manual quando nem o POST nem a consulta de recuperação obtêm
      // resposta do backend. Uma resposta HTTP ou um GET bem-sucedido encerra
      // a tentativa do navegador e o próximo clique recebe uma chave nova.
      if (!isApiNetworkError(error) || refreshedRegistration) {
        paymentAttemptRef.current = null;
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (registrationSubmissionRef.current || registrationRateLimit.isRateLimited) return;

    registrationSubmissionRef.current = true;
    try {
      await submitRegistration(event.currentTarget);
    } finally {
      registrationSubmissionRef.current = false;
    }
  }

  async function submitRegistration(form: HTMLFormElement) {
    setFeedback(null);
    setFieldErrors({});
    setPaymentResult(null);
    setPaymentError(null);
    setRecoveryError(null);

    if (!participant) {
      redirectToParticipantLogin();
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const phone = normalizeOptionalText(formData.get("phone"));
    const document = normalizeOptionalText(formData.get("document"));
    const sex = normalizeOptionalText(formData.get("sex"));
    const age = normalizeAge(formData.get("age"));

    const extraPayload = Object.fromEntries(
      Object.entries(extraFields).filter(([, value]) => hasValue(value))
    );

    let createdRegistration: ParticipantRegistrationDetail;

    try {
      createdRegistration = await createRegistration.mutateAsync({
        name,
        phone,
        document,
        sex,
        age,
        extra_fields: extraPayload,
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        redirectToParticipantLogin();
        return;
      }

      if (registrationRateLimit.startFromError(error)) {
        setFeedback(null);
        return;
      }

      const closure = getRegistrationClosureFromApiCode(
        getApiErrorCode(error),
        getErrorMessage(error)
      );
      if (closure) {
        createRegistration.reset();
        setFeedback(null);
        setFieldErrors({});
        setPaymentResult(null);
        setPaymentError(null);
        setRecoveryError(null);
        setRecoveryContext(null);
        setRegistration(null);
        onRegistrationClosed?.(closure);
        return;
      }

      const duplicate = getDuplicateRegistrationDetail(error);
      if (duplicate) {
        const context = {
          registrationId: duplicate.registration_id,
          canResumePayment: duplicate.can_resume_payment,
        };

        setFeedback({
          variant: "warning",
          title: "Você já está inscrito neste evento",
          message:
            "Encontramos sua inscrição e estamos carregando as informações de pagamento.",
        });
        await loadExistingRegistration(context);
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
      return;
    }

    const context = {
      registrationId: createdRegistration.id,
      canResumePayment: true,
    };
    setRecoveryContext(context);
    setRegistration(createdRegistration);
    form.reset();
    setExtraFields({});

    if (
      !requiresPayment ||
      createdRegistration.payment_status === "not_required"
    ) {
      setFeedback({
        variant: "success",
        title: "Este evento é gratuito",
        message: "Sua inscrição foi confirmada e não exige pagamento.",
      });
      return;
    }

    setFeedback({
      variant: "info",
      title: "Inscrição criada",
      message: "Sua inscrição foi salva. Estamos preparando o pagamento por Pix.",
    });
    await generatePixForRegistration(createdRegistration.id);
  }

  if (isLoadingParticipant) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner label="Verificando sua conta de participante..." />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="space-y-4">
        <Alert variant="info" title="Entre para se inscrever">
          <p>
            Entre com sua conta de participante para continuar a inscrição.
          </p>
        </Alert>
        <Button className="w-full" onClick={redirectToParticipantLogin}>
          Inscrever-se
        </Button>
        <p className="text-center text-xs text-slate-500">
          Ainda não tem uma conta? Você poderá criar uma na próxima etapa.
        </p>
      </div>
    );
  }

  const isPending =
    createRegistration.isPending ||
    recoverRegistration.isPending ||
    createPix.isPending;
  const hasRegistrationFlow = Boolean(recoveryContext || registration);

  return (
    <div className="space-y-6">
      <Alert variant="info" title="Conta de participante">
        <p>
          Sua inscrição será vinculada ao E-mail <strong>{participant.email}</strong>.
        </p>
      </Alert>

      {registrationRateLimit.message ? (
        <Alert
          variant="warning"
          title="Aguarde para tentar novamente"
          aria-live="polite"
        >
          <p>{registrationRateLimit.message}</p>
        </Alert>
      ) : null}

      {feedback ? (
        <Alert variant={feedback.variant} title={feedback.title}>
          <p>{feedback.message}</p>
        </Alert>
      ) : null}

      {currentRegistration ? (
        <Alert variant="info" title="Inscrição localizada">
          <p>
            Inscrição #{currentRegistration.id}: {getParticipantRegistrationStatusLabel(
              currentRegistration.registration_status
            )}. Pagamento: {getParticipantPaymentStatusLabel(currentRegistration.payment_status)}.
          </p>
        </Alert>
      ) : null}

      {currentRegistration ? (
        <PixPaymentBox
          registration={currentRegistration}
          result={paymentResult}
          canResumePayment={recoveryContext?.canResumePayment ?? true}
          isGenerating={createPix.isPending}
          generationError={paymentError}
          isRefreshingStatus={registrationPolling.isFetching}
          onGeneratePix={() => generatePixForRegistration(currentRegistration.id)}
        />
      ) : null}

      {hasRegistrationFlow && !registration ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {recoverRegistration.isPending ? (
            <Spinner label="Carregando sua inscrição e o pagamento..." />
          ) : null}

          {recoveryError ? (
            <Alert variant="warning" title="Inscrição existente">
              <p>
                Você já está inscrito, mas não foi possível carregar os detalhes agora.
              </p>
              <p className="mt-2 text-sm">
                {getErrorMessage(
                  recoveryError,
                  "Tente carregar novamente ou consulte Minhas inscrições."
                )}
              </p>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {recoveryContext && !recoverRegistration.isPending ? (
              <Button
                variant="secondary"
                onClick={() => loadExistingRegistration(recoveryContext)}
              >
                Tentar carregar novamente
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link href="/minhas-inscricoes">Ir para Minhas inscrições</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {currentRegistration ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href={`/minhas-inscricoes/${currentRegistration.id}`}>
              Ver inscrição completa
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/minhas-inscricoes">Minhas inscrições</Link>
          </Button>
        </div>
      ) : null}

      {!hasRegistrationFlow ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">
                Nome completo <span className="text-red-600">*</span>
              </Label>
              <Input id="name" name="name" placeholder="Seu nome" required />
              {fieldErrors.name ? (
                <p className="text-xs font-medium text-red-600">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" placeholder="(91) 99999-9999" />
              {fieldErrors.phone ? (
                <p className="text-xs font-medium text-red-600">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Documento</Label>
              <Input id="document" name="document" placeholder="CPF/CNPJ" />
              {fieldErrors.document ? (
                <p className="text-xs font-medium text-red-600">
                  {fieldErrors.document}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sexo</Label>
              <Input id="sex" name="sex" placeholder="Informe como preferir" />
              {fieldErrors.sex ? (
                <p className="text-xs font-medium text-red-600">
                  {fieldErrors.sex}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                name="age"
                inputMode="numeric"
                type="number"
                min={0}
                max={130}
              />
              {fieldErrors.age ? (
                <p className="text-xs font-medium text-red-600">
                  {fieldErrors.age}
                </p>
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

          <Button
            className="w-full"
            type="submit"
            disabled={isPending || registrationRateLimit.isRateLimited}
          >
            {isPending
              ? "Enviando inscrição..."
              : registrationRateLimit.isRateLimited
                ? `Tente novamente em ${registrationRateLimit.secondsRemaining}s`
                : requiresPayment
                ? "Enviar inscrição e gerar Pix"
                : "Confirmar inscrição gratuita"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
