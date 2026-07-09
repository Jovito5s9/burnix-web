import type { AuthUser } from "@/types/auth";
import type { Client } from "@/types/client";
import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";

export type AdminRole = "admin" | "superuser" | "super_user";

export type AdminUser = AuthUser & {
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminEvent = Contract;
export type AdminClient = Client;
export type AdminPayment = Payment;

export type AdminListParams = {
  skip?: number;
  limit?: number;
};

export type AdminListResult<T> = {
  items: T[];
  total: number | null;
  skip: number;
  limit: number;
  hasMore: boolean;
};
