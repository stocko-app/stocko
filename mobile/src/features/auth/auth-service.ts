import { api } from "../../lib/api";

export type LoginResponse = { accessToken: string; userId: string };

export async function checkUser(emailOrUsername: string): Promise<boolean> {
  const response = await api.post<{ exists: boolean }>("/api/auth/check-user", { emailOrUsername });
  return response.exists;
}

export async function login(emailOrUsername: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>("/api/auth/login", { emailOrUsername, password });
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  fullName: string;
}): Promise<LoginResponse> {
  return api.post<LoginResponse>("/api/auth/register", payload);
}

