import type { AuthUser } from "@nexum-tower/shared";
import { apiRequest } from "./api";

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function refreshRequest(): Promise<AuthUser | null> {
  try {
    const data = await apiRequest<{ user: AuthUser | null }>("/auth/refresh", { method: "POST" });
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}

export async function meRequest(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me");
}
