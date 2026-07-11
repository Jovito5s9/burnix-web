import { createApiClient } from "@/services/http-client";

/**
 * Cliente autenticado do organizador.
 *
 * O navegador nunca lê o JWT. O Route Handler do BFF recupera o cookie
 * HttpOnly `burnix.access_token` e acrescenta o header Authorization ao chamar
 * o backend.
 */
export const api = createApiClient("/api/backend/organizer");

/** Cliente para endpoints realmente públicos do backend. */
export const publicApi = createApiClient("/api/backend/public");
