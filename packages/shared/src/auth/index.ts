import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  tenant: authTenantSchema,
  roles: z.array(z.string()),
  groups: z.array(z.string()),
  permissions: z.array(z.string()),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string().optional(),
  user: authUserSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshResponseSchema = z.object({
  accessToken: z.string().optional(),
  user: authUserSchema,
});

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export function permissionMatches(granted: string[], required: string): boolean {
  if (granted.includes(required)) return true;

  const [resource] = required.split(".");
  if (granted.includes(`${resource}.*`)) return true;
  if (granted.includes("*")) return true;

  return false;
}

export function hasAllPermissions(granted: string[], required: string[]): boolean {
  return required.every((permission) => permissionMatches(granted, permission));
}

export function hasAnyPermission(granted: string[], required: string[]): boolean {
  return required.some((permission) => permissionMatches(granted, permission));
}
