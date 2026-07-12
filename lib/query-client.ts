import { QueryClient } from "@tanstack/react-query";

import {
  getApiErrorRetryable,
  getApiErrorStatus,
  isApiNetworkError,
} from "@/lib/get-error-message";

let browserQueryClient: QueryClient | undefined;

const RETRYABLE_SERVER_STATUSES = new Set([500, 502, 503, 504]);

export function isRetryableRequestError(error: unknown) {
  if (getApiErrorRetryable(error) === false) return false;
  if (isApiNetworkError(error)) return true;

  const status = getApiErrorStatus(error);
  return status !== undefined && RETRYABLE_SERVER_STATUSES.has(status);
}

export function shouldRetryQuery(failureCount: number, error: unknown) {
  return failureCount < 2 && isRetryableRequestError(error);
}

export function shouldRetryMutation(failureCount: number, error: unknown) {
  return failureCount < 1 && isRetryableRequestError(error);
}

export function progressiveRetryDelay(attemptIndex: number) {
  return Math.min(500 * 2 ** attemptIndex, 2_000);
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay: progressiveRetryDelay,
      },
      mutations: {
        retry: shouldRetryMutation,
        retryDelay: progressiveRetryDelay,
      },
    },
  });
}

export function getQueryClient() {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}
