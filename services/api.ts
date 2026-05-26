import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function readToken() { 
  if (typeof window === "undefined") return null;

  const localToken = window.localStorage.getItem("burnix.access_token");
  if (localToken) return localToken;

  const cookieMatch = document.cookie.match(/(?:^|; )burnix\.access_token=([^;]+)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
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

    if (status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("burnix.access_token");
    }

    const message =
      error?.response?.data?.detail ??
      error?.response?.data?.message ??
      "Erro inesperado na comunicação com a API.";

    return Promise.reject(new Error(message));
  }
);
