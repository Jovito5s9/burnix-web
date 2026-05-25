export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: "admin" | "staff" | "customer";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};
