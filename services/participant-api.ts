import { createApiClient } from "@/services/http-client";

/**
 * Cliente autenticado do participante.
 *
 * A autenticação é aplicada no servidor pelo BFF a partir do cookie HttpOnly
 * `burnix.participant_access_token`. Nenhum JWT é exposto ao JavaScript.
 */
export const participantApi = createApiClient("/api/backend/participant");
