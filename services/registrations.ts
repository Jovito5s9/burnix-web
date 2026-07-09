import { api } from "@/services/api";
import { createRegistrationPixPayment as createRegistrationPixPaymentRequest } from "@/services/payments";
import type {
  CreateRegistrationPixPayload,
  PaymentPixResponse,
} from "@/types/payment";
import type {
  PublicRegistrationPayload,
  Registration,
} from "@/types/registration";

export async function listContractRegistrations(contractId: string | number) {
  const { data } = await api.get<Registration[]>(
    `/contracts/${contractId}/registrations`
  );
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

export async function createRegistrationPixPayment(
  clientId: string | number,
  payload: CreateRegistrationPixPayload = {}
): Promise<PaymentPixResponse> {
  return createRegistrationPixPaymentRequest(clientId, payload);
}
