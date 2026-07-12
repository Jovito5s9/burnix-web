import { ApiClientError } from "@/lib/get-error-message";
import { api } from "@/services/api";
import type {
  Contract,
  ContractActionPayload,
  ContractCreatePayload,
  ContractListParams,
  ContractListResponse,
  ContractStatusAction,
  ContractUpdatePayload,
} from "@/types/contract";
import type { Payment } from "@/types/payment";
import type { Registration } from "@/types/registration";

function isContractListResponse(value: unknown): value is ContractListResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const response = value as Partial<ContractListResponse>;

  return (
    Array.isArray(response.items) &&
    Number.isInteger(response.total) &&
    Number(response.total) >= 0 &&
    Number.isInteger(response.skip) &&
    Number(response.skip) >= 0 &&
    Number.isInteger(response.limit) &&
    Number(response.limit) > 0
  );
}

export async function listContracts(params?: ContractListParams) {
  const { data } = await api.get<unknown>("/contracts", { params });

  if (!isContractListResponse(data)) {
    throw new ApiClientError("Não foi possível carregar a lista de eventos.", {
      status: 502,
      code: "invalid_contract_list_response",
      retryable: false,
    });
  }

  return data;
}

export async function getContract(id: string | number) {
  const { data } = await api.get<Contract>(`/contracts/${id}`);
  return data;
}

export async function createContract(payload: ContractCreatePayload) {
  const { data } = await api.post<Contract>("/contracts", payload);
  return data;
}

export async function updateContract(
  id: string | number,
  payload: ContractUpdatePayload
) {
  const { data } = await api.patch<Contract>(`/contracts/${id}`, payload);
  return data;
}

export async function runContractStatusAction(
  id: string | number,
  action: ContractStatusAction,
  payload: ContractActionPayload
) {
  const { data } = await api.post<Contract>(
    `/contracts/${id}/${action}`,
    payload
  );
  return data;
}

export async function deleteContract(id: string | number) {
  await api.delete(`/contracts/${id}`);
}

export async function listContractRegistrations(contractId: string | number) {
  const { data } = await api.get<Registration[]>(
    `/contracts/${contractId}/registrations`
  );
  return data;
}

export async function listContractPayments(contractId: string | number) {
  const { data } = await api.get<Payment[]>(
    `/contracts/${contractId}/payments`
  );
  return data;
}
