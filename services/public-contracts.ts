import { participantApi } from "@/services/participant-api";
import { publicApi } from "@/services/api";
import type {
  ParticipantRegistrationCreatePayload,
  ParticipantRegistrationDetail,
} from "@/types/participant-registration";
import type {
  ParticipantPaymentCreatePayload,
  ParticipantPaymentResponse,
} from "@/types/payment";
import type { PublicContract } from "@/types/public-contract";

export async function getPublicContract(contractId: string | number) {
  const { data } = await publicApi.get<PublicContract>(
    `/public/contracts/${contractId}`
  );
  return data;
}

/**
 * Cria a inscrição a partir da página pública, mas sempre usando a sessão
 * autenticada do participante. Identidade e e-mail continuam derivados pelo
 * backend, nunca pelo formulário do navegador.
 */
export async function createPublicEventRegistration(
  contractId: string | number,
  payload: ParticipantRegistrationCreatePayload
) {
  const { data } = await participantApi.post<ParticipantRegistrationDetail>(
    `/participant/contracts/${contractId}/registrations`,
    payload
  );

  return data;
}

/** Recupera uma inscrição já existente para continuar o fluxo público. */
export async function getPublicEventRegistration(
  registrationId: string | number
) {
  const { data } = await participantApi.get<ParticipantRegistrationDetail>(
    `/participant/registrations/${registrationId}`
  );

  return data;
}

/** Gera ou reutiliza a tentativa Pix autorizada da inscrição autenticada. */
export async function generatePublicEventRegistrationPix(
  registrationId: string | number,
  payload: ParticipantPaymentCreatePayload
) {
  const { data } = await participantApi.post<ParticipantPaymentResponse>(
    `/participant/registrations/${registrationId}/payments/pix`,
    payload
  );

  return data;
}
