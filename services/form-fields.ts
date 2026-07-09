import { api } from "@/services/api";
import type {
  ContractFormField,
  ContractFormFieldPayload,
  ContractFormFieldUpdatePayload,
} from "@/types/form-field";

export async function listFormFields(contractId: string | number) {
  const { data } = await api.get<ContractFormField[]>(
    `/contracts/${contractId}/form-fields/`
  );
  return data;
}

export async function createFormField(
  contractId: string | number,
  payload: ContractFormFieldPayload
) {
  const { data } = await api.post<ContractFormField>(
    `/contracts/${contractId}/form-fields/`,
    payload
  );
  return data;
}

export async function getFormField(
  contractId: string | number,
  fieldId: string | number
) {
  const { data } = await api.get<ContractFormField>(
    `/contracts/${contractId}/form-fields/${fieldId}`
  );
  return data;
}

export async function updateFormField(
  contractId: string | number,
  fieldId: string | number,
  payload: ContractFormFieldUpdatePayload
) {
  const { data } = await api.patch<ContractFormField>(
    `/contracts/${contractId}/form-fields/${fieldId}`,
    payload
  );
  return data;
}

export async function deleteFormField(
  contractId: string | number,
  fieldId: string | number
) {
  await api.delete(`/contracts/${contractId}/form-fields/${fieldId}`);
}
