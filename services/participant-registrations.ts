import {
  createPublicEventRegistration,
  generatePublicEventRegistrationPix,
  getPublicEventRegistration,
} from "@/services/public-contracts";
import { participantApi } from "@/services/participant-api";
import type {
  ParticipantRegistration,
  ParticipantRegistrationCreatePayload,
} from "@/types/participant-registration";
import type { ParticipantPaymentCreatePayload } from "@/types/payment";

export async function listMyRegistrations() {
  const { data } = await participantApi.get<ParticipantRegistration[]>(
    "/participant/registrations"
  );

  return data;
}

export const getMyRegistration = getPublicEventRegistration;

export function createParticipantRegistration(
  contractId: string | number,
  payload: ParticipantRegistrationCreatePayload
) {
  return createPublicEventRegistration(contractId, payload);
}

export function generateParticipantRegistrationPix(
  registrationId: string | number,
  payload: ParticipantPaymentCreatePayload = {}
) {
  return generatePublicEventRegistrationPix(registrationId, payload);
}
