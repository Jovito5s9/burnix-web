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

/** Resposta segura do BFF. O access token nunca é devolvido ao navegador. */
export type LoginResponse = {
  authenticated: true;
};

export type RegisterResponse = AuthUser;
