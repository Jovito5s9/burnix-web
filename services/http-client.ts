import axios from "axios";
import { ApiClientError, getApiFieldErrors, getErrorMessage } from "@/lib/get-error-message";

export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const message = getErrorMessage(
        error,
        "Erro inesperado na comunicação com a API."
      );
      const fieldErrors = getApiFieldErrors(error);

      return Promise.reject(new ApiClientError(message, status, fieldErrors));
    }
  );

  return client;
}
