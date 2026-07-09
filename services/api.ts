import axios from "axios";
import { getErrorMessage } from "@/lib/get-error-message";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "burnix.access_token";

function readToken() {
  if (typeof window === "undefined") return null;

  const localToken = window.localStorage.getItem(TOKEN_KEY);
  if (localToken) return localToken;

  const cookieMatch = document.cookie.match(/(?:^|; )burnix\.access_token=([^;]+)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
}

function removeStoredToken() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = readToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      removeStoredToken();
    }

    const message = getErrorMessage(
      error,
      "Erro inesperado na comunicação com a API."
    );

    return Promise.reject(new Error(message));
  }
);
