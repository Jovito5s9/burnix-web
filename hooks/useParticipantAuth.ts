"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentParticipant,
  loginParticipant,
  logoutParticipant,
  registerParticipant,
} from "@/services/participant-auth";
import type {
  ParticipantLoginPayload,
  ParticipantRegisterPayload,
} from "@/types/participant-auth";

const participantAuthKey = ["participant-auth", "me"] as const;

export function useParticipantAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: participantAuthKey,
    queryFn: getCurrentParticipant,
    retry: false,
    staleTime: 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (payload: ParticipantLoginPayload) => loginParticipant(payload),
    onSuccess: ({ participant }) => {
      queryClient.setQueryData(participantAuthKey, participant);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: ParticipantRegisterPayload) =>
      registerParticipant(payload),
    onSuccess: ({ participant }) => {
      queryClient.setQueryData(participantAuthKey, participant);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutParticipant,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["participant-auth"] });
      queryClient.removeQueries({ queryKey: ["participant-registrations"] });
    },
  });

  const participant = meQuery.data ?? null;

  return {
    participant,
    isAuthenticated: Boolean(participant),
    isLoadingParticipant: meQuery.isLoading,
    isFetchingParticipant: meQuery.isFetching,
    participantAuthError: meQuery.error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
