import { api } from "@/services/api";
import type { Contract } from "@/types/contract";

export async function listContracts() {
  const { data } = await api.get<Contract[]>("/contracts");
  return data;
}

export async function getContract(id: string) {
  const { data } = await api.get<Contract>(`/contracts/${id}`);
  return data;
}
