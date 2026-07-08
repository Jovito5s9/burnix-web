import { api } from "@/services/api";

import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  AuthUser,
} from "@/types/auth";

const TOKEN_KEY = "burnix.access_token";

function saveToken(token: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/`;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);

  saveToken(data.access_token);

  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);

  saveToken(data.access_token);

  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export function clearToken() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}