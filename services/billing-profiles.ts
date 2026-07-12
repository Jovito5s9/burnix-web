import { ApiClientError } from "@/lib/get-error-message";
import { api } from "@/services/api";
import type {
  BillingProfile,
  BillingProfileListParams,
  BillingProfilePayload,
} from "@/types/billing-profile";

function isNotFoundError(error: unknown) {
  return error instanceof ApiClientError && error.status === 404;
}

export async function getMyBillingProfile() {
  try {
    const { data } = await api.get<BillingProfile>("/billing-profiles/me");
    return data;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export async function upsertMyBillingProfile(payload: BillingProfilePayload) {
  const { data } = await api.put<BillingProfile>("/billing-profiles/me", payload);
  return data;
}

export async function patchMyBillingProfile(payload: BillingProfilePayload) {
  const { data } = await api.patch<BillingProfile>("/billing-profiles/me", payload);
  return data;
}

export async function listBillingProfiles(params?: BillingProfileListParams) {
  const { data } = await api.get<BillingProfile[]>("/billing-profiles", { params });
  return data;
}

export async function getBillingProfile(id: string | number) {
  const { data } = await api.get<BillingProfile>(`/billing-profiles/${id}`);
  return data;
}
