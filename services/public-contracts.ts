import { publicApi } from "@/services/api";
import type { PublicContract } from "@/types/public-contract";

export async function getPublicContract(contractId: string | number) {
  const { data } = await publicApi.get<PublicContract>(
    `/public/contracts/${contractId}`
  );
  return data;
}
