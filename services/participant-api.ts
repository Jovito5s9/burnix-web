import { createApiClient } from "@/services/http-client";
import type {
  ParticipantRegistrationCreatePayload,
  ParticipantRegistrationDetail,
  ParticipantRegistrationListItem,
} from "@/types/participant";
import type {
  ParticipantPaymentCreatePayload,
  ParticipantPaymentResponse,
} from "@/types/payment";

/**
 * Cliente autenticado do participante.
 *
 * A autenticação é aplicada no servidor pelo BFF a partir do cookie HttpOnly
 * `burnix.participant_access_token`. Nenhum JWT é exposto ao JavaScript.
 */
export const participantApi = createApiClient("/api/backend/participant");

export async function listParticipantRegistrations(params?: {
  skip?: number;
  limit?: number;
}) {
  const { data } = await participantApi.get<ParticipantRegistrationListItem[]>(
    "/participant/registrations",
    { params }
  );
  return data;
}

export async function getParticipantRegistration(registrationId: string | number) {
  const { data } = await participantApi.get<ParticipantRegistrationDetail>(
    `/participant/registrations/${registrationId}`
  );
  return data;
}

export async function createParticipantRegistration(
  contractId: string | number,
  payload: ParticipantRegistrationCreatePayload
) {
  const { data } = await participantApi.post<ParticipantRegistrationDetail>(
    `/participant/contracts/${contractId}/registrations`,
    payload
  );
  return data;
}

export async function createParticipantRegistrationPix(
  registrationId: string | number,
  payload: ParticipantPaymentCreatePayload = {}
) {
  const { data } = await participantApi.post<ParticipantPaymentResponse>(
    `/participant/registrations/${registrationId}/payments/pix`,
    payload
  );
  return data;
}
