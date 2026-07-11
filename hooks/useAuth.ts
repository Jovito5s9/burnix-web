"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  login,
  logoutOrganizer,
  register,
} from "@/services/auth";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/types/auth";

const adminRoles = new Set(["admin", "superuser", "super_user"]);

export function isAdminUser(user?: AuthUser | null) {
  return Boolean(user?.role && adminRoles.has(user.role));
}

export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60 * 1000,
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

  const logoutMutation = useMutation({
    mutationFn: logoutOrganizer,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["auth"] });
    },
  });

  const user = meQuery.data ?? null;

  return {
    user,
    isAdmin: isAdminUser(user),
    isLoadingUser: meQuery.isLoading,
    isFetchingUser: meQuery.isFetching,
    authError: meQuery.error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
