import { createApiClient } from "@/services/http-client";
import { participantApi } from "@/services/participant-api";
import type { Participant } from "@/types/participant";
import type {
  ParticipantLoginPayload,
  ParticipantRegisterPayload,
  ParticipantSessionResponse,
} from "@/types/participant-auth";

const sessionApi = createApiClient("/api/session");

export async function loginParticipant(payload: ParticipantLoginPayload) {
  const { data } = await sessionApi.post<ParticipantSessionResponse>(
    "/participant/login",
    payload
  );
  return data;
}

export async function registerParticipant(payload: ParticipantRegisterPayload) {
  const { data } = await sessionApi.post<ParticipantSessionResponse>(
    "/participant/register",
    payload
  );
  return data;
}

export async function getCurrentParticipant() {
  const { data } = await participantApi.get<Participant>("/participant-auth/me");
  return data;
}

export async function logoutParticipant() {
  await sessionApi.post("/logout", { session: "participant" });
}
