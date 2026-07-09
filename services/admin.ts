import { api } from "@/services/api";
import type {
  AdminClient,
  AdminEvent,
  AdminListParams,
  AdminListResult,
  AdminPayment,
  AdminUser,
} from "@/types/admin";

const MAX_ADMIN_LIMIT = 500;
const DEFAULT_ADMIN_LIMIT = 50;

function normalizeParams(params?: AdminListParams) {
  const skip = Math.max(0, Number(params?.skip ?? 0));
  const rawLimit = Number(params?.limit ?? DEFAULT_ADMIN_LIMIT);
  const limit = Math.min(MAX_ADMIN_LIMIT, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_ADMIN_LIMIT));

  return { skip, limit };
}

function normalizeListResult<T>(data: unknown, params?: AdminListParams): AdminListResult<T> {
  const { skip, limit } = normalizeParams(params);

  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: null,
      skip,
      limit,
      hasMore: data.length >= limit,
    };
  }

  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const items = Array.isArray(record.items)
    ? (record.items as T[])
    : Array.isArray(record.results)
      ? (record.results as T[])
      : [];
  const total = typeof record.total === "number"
    ? record.total
    : typeof record.count === "number"
      ? record.count
      : null;

  return {
    items,
    total,
    skip,
    limit,
    hasMore: total === null ? items.length >= limit : skip + items.length < total,
  };
}

export async function listAdminUsers(params?: AdminListParams) {
  const normalizedParams = normalizeParams(params);
  const { data } = await api.get<unknown>("/admin/users", { params: normalizedParams });
  return normalizeListResult<AdminUser>(data, normalizedParams);
}

export async function listAdminEvents(params?: AdminListParams) {
  const normalizedParams = normalizeParams(params);
  const { data } = await api.get<unknown>("/admin/contracts", { params: normalizedParams });
  return normalizeListResult<AdminEvent>(data, normalizedParams);
}

export async function listAdminClients(params?: AdminListParams) {
  const normalizedParams = normalizeParams(params);
  const { data } = await api.get<unknown>("/admin/clients", { params: normalizedParams });
  return normalizeListResult<AdminClient>(data, normalizedParams);
}

export async function listAdminPayments(params?: AdminListParams) {
  const normalizedParams = normalizeParams(params);
  const { data } = await api.get<unknown>("/admin/payments", { params: normalizedParams });
  return normalizeListResult<AdminPayment>(data, normalizedParams);
}
