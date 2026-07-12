import { describe, expect, it } from "vitest";

import {
  ApiClientError,
  formatRateLimitMessage,
  getApiRetryAfterSeconds,
  getErrorMessage,
} from "@/lib/get-error-message";
import {
  progressiveRetryDelay,
  shouldRetryMutation,
  shouldRetryQuery,
} from "@/lib/query-client";

describe("tratamento de rate limit", () => {
  it("gera uma mensagem amigável com o Retry-After", () => {
    const error = new ApiClientError("rate limit", {
      status: 429,
      retryAfterSeconds: 45,
      code: "rate_limit_exceeded",
    });

    expect(getApiRetryAfterSeconds(error)).toBe(45);
    expect(getErrorMessage(error)).toBe(
      "Muitas tentativas foram realizadas. Aguarde 45 segundos e tente novamente."
    );
    expect(formatRateLimitMessage(1)).toContain("1 segundo");
  });

  it.each([400, 401, 403, 404, 409, 422, 429])(
    "não repete automaticamente o status %s",
    (status) => {
      const error = new ApiClientError("request failed", { status });

      expect(shouldRetryQuery(0, error)).toBe(false);
      expect(shouldRetryMutation(0, error)).toBe(false);
    }
  );

  it("limita retries a erros de rede e alguns 5xx", () => {
    const networkError = new ApiClientError("network error");
    const unavailableError = new ApiClientError("unavailable", { status: 503 });
    const notImplementedError = new ApiClientError("not implemented", {
      status: 501,
    });

    expect(shouldRetryQuery(0, networkError)).toBe(true);
    expect(shouldRetryQuery(1, unavailableError)).toBe(true);
    expect(shouldRetryQuery(2, unavailableError)).toBe(false);
    expect(shouldRetryMutation(0, unavailableError)).toBe(true);
    expect(shouldRetryMutation(1, unavailableError)).toBe(false);
    expect(shouldRetryQuery(0, notImplementedError)).toBe(false);
    expect(progressiveRetryDelay(0)).toBe(500);
    expect(progressiveRetryDelay(4)).toBe(2_000);
  });
});
