import axios from "axios";

import {
  ApiClientError,
  getApiErrorCode,
  getApiErrorDetail,
  getApiErrorRetryable,
  getApiFieldErrors,
  getApiRetryAfterSeconds,
  getErrorMessage,
} from "@/lib/get-error-message";

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

      return Promise.reject(
        new ApiClientError(message, {
          status,
          fieldErrors: getApiFieldErrors(error),
          code: getApiErrorCode(error),
          retryable: getApiErrorRetryable(error),
          retryAfterSeconds: getApiRetryAfterSeconds(error) ?? undefined,
          detail: getApiErrorDetail(error),
        })
      );
    }
  );

  return client;
}
