import { api } from "@/services/api";
import { createApiClient } from "@/services/http-client";

import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  AuthUser,
} from "@/types/auth";

const sessionApi = createApiClient("/api/session");

export async function login(payload: LoginPayload) {
  const { data } = await sessionApi.post<LoginResponse>(
    "/organizer/login",
    payload
  );
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>("/auth/register", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export async function logoutOrganizer() {
  await sessionApi.post("/logout", { session: "organizer" });
}
