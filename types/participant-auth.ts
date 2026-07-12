import type { Participant } from "@/types/participant";

export type ParticipantLoginPayload = {
  email: string;
  password: string;
};

export type ParticipantRegisterPayload = ParticipantLoginPayload;

/** Resposta original do backend, consumida apenas pelo Route Handler. */
export type ParticipantBackendAuthResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  participant: Participant;
};

/** Resposta segura do BFF, sem o JWT. */
export type ParticipantSessionResponse = {
  participant: Participant;
};
