import { api } from "@/services/api";
import type { Contract, ContractListResponse } from "@/types/contract";

export async function listContracts() {
  const { data } = await api.get<ContractListResponse>("/contracts");
  return data;
}

export async function getContract(id: string) {
  const { data } = await api.get<Contract>(`/contracts/${id}`);
  return data;
}
