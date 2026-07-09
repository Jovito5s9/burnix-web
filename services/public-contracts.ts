import { api } from "@/services/api";
import { createRegistrationPixPayment } from "@/services/payments";
import type { CreateRegistrationPixPayload } from "@/types/payment";
import type { PublicContract } from "@/types/public-contract";
import type {
  PublicRegistrationPayload,
  Registration,
} from "@/types/registration";

export async function getPublicContract(contractId: string | number) {
  const { data } = await api.get<PublicContract>(`/public/contracts/${contractId}`);
  return data;
}

export async function createPublicRegistration(
  contractId: string | number,
  payload: PublicRegistrationPayload
) {
  const { data } = await api.post<Registration>(
    `/public/contracts/${contractId}/registrations`,
    payload
  );
  return data;
}

export async function createRegistrationPix(
  clientId: string | number,
  payload: CreateRegistrationPixPayload = {}
) {
  return createRegistrationPixPayment(clientId, payload);
}
