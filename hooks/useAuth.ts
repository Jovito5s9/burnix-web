"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearToken, getCurrentUser, login, register } from "@/services/auth";
import type { LoginPayload, RegisterPayload } from "@/types/auth";

export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });

  return {
    user: meQuery.data ?? null,
    isLoadingUser: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    logout: () => {
      clearToken();
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
    },
  };
}
