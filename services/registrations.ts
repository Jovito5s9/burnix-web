import { api } from "@/services/api";
import type { Registration } from "@/types/registration";

/** Lista interna do organizador, limitada ao tenant pelo backend. */
export async function listContractRegistrations(contractId: string | number) {
  const { data } = await api.get<Registration[]>(
    `/contracts/${contractId}/registrations`
  );
  return data;
}
