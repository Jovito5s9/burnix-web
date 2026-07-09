import { api } from "@/services/api";
import type {
  Client,
  ClientCreatePayload,
  ClientListParams,
  ClientUpdatePayload,
} from "@/types/client";

export async function listClients(params?: ClientListParams) {
  const { data } = await api.get<Client[]>("/clients/", { params });
  return data;
}

export async function createClient(payload: ClientCreatePayload) {
  const { data } = await api.post<Client>("/clients/", payload);
  return data;
}

export async function getClient(id: string | number) {
  const { data } = await api.get<Client>(`/clients/${id}`);
  return data;
}

export async function updateClient(
  id: string | number,
  payload: ClientUpdatePayload
) {
  const { data } = await api.patch<Client>(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: string | number) {
  await api.delete(`/clients/${id}`);
}
