import { participantApi } from "@/services/participant-api";
import type {
  ParticipantRegistration,
  ParticipantRegistrationCreatePayload,
  ParticipantRegistrationDetail,
} from "@/types/participant-registration";
import type {
  ParticipantPaymentCreatePayload,
  ParticipantPaymentResponse,
} from "@/types/payment";

export async function listMyRegistrations() {
  const { data } = await participantApi.get<ParticipantRegistration[]>(
    "/participant/registrations"
  );

  return data;
}

export async function getMyRegistration(registrationId: string | number) {
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

export async function generateParticipantRegistrationPix(
  registrationId: string | number,
  payload: ParticipantPaymentCreatePayload = {}
) {
  const { data } = await participantApi.post<ParticipantPaymentResponse>(
    `/participant/registrations/${registrationId}/payments/pix`,
    payload
  );

  return data;
}
