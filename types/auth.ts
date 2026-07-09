export type AuthUser = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type RegisterResponse = AuthUser;
