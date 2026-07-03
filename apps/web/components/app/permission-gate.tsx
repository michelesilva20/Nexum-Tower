"use client";

import type { AuthUser } from "@nexum-tower/shared";
import { permissionMatches } from "@nexum-tower/shared";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, type ReactNode } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function checkAll(user: AuthUser, permissions: string | string[]) {
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return list.every((p) => permissionMatches(user.permissions, p));
}

function checkAny(user: AuthUser, permissions: string | string[]) {
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return list.some((p) => permissionMatches(user.permissions, p));
}

// ─── PermissionGate ──────────────────────────────────────────────────────────

type PermissionGateProps = {
  /** Permissão(ões) exigida(s) — TODAS devem ser satisfeitas (mode: "all") */
  permission: string | string[];
  mode?: "all" | "any";
  /** Se true, redireciona para /access-denied quando sem permissão. Default: true */
  redirect?: boolean;
  /** Fallback renderizado quando sem permissão (sem redirect) */
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGate({
  permission,
  mode = "all",
  redirect = true,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const hasAccess =
    !isLoading &&
    user != null &&
    (mode === "any" ? checkAny(user, permission) : checkAll(user, permission));

  useEffect(() => {
    if (isLoading || !user) return;
    if (!hasAccess && redirect) {
      router.replace("/access-denied");
    }
  }, [user, isLoading, hasAccess, redirect, router]);

  if (isLoading || !user) return null;
  if (!hasAccess) return <>{fallback}</>;

  return <>{children}</>;
}

// ─── AnyPermissionGate ───────────────────────────────────────────────────────

type AnyPermissionGateProps = {
  /** Qualquer uma dessas permissões é suficiente */
  permissions: string[];
  redirect?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
};

export function AnyPermissionGate({
  permissions,
  redirect = false,
  fallback = null,
  children,
}: AnyPermissionGateProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const hasAccess =
    !isLoading && user != null && checkAny(user, permissions);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!hasAccess && redirect) {
      router.replace("/access-denied");
    }
  }, [user, isLoading, hasAccess, redirect, router]);

  if (isLoading || !user) return null;
  if (!hasAccess) return <>{fallback}</>;

  return <>{children}</>;
}

// ─── FeatureGate ─────────────────────────────────────────────────────────────

type FeatureGateProps = {
  /** Chave da feature flag exigida */
  feature: string;
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Esconde conteúdo se a feature flag não estiver no token do usuário.
 * Se o token não carregar features, assume que a feature está ativa (fail-open no frontend).
 * O backend é a fonte real de segurança.
 */
export function FeatureGate({ feature, fallback = null, children }: FeatureGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;

  // Se não há array de features no token, permite (fail-open)
  const features = (user as AuthUser & { features?: string[] }).features;
  if (!features) return <>{children}</>;

  if (!features.includes(feature)) return <>{fallback}</>;

  return <>{children}</>;
}

// ─── RoleGate ────────────────────────────────────────────────────────────────

type RoleGateProps = {
  roles: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;

  const userRoles = (user as AuthUser & { roles?: string[] }).roles ?? [];
  const hasRole = roles.some((r) => userRoles.includes(r));

  if (!hasRole) return <>{fallback}</>;

  return <>{children}</>;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function usePermission(permission: string) {
  const { user } = useAuth();
  if (!user) return false;
  return permissionMatches(user.permissions, permission);
}

export function useAnyPermission(permissions: string[]) {
  const { user } = useAuth();
  if (!user) return false;
  return checkAny(user, permissions);
}

export function useAllPermissions(permissions: string[]) {
  const { user } = useAuth();
  if (!user) return false;
  return checkAll(user, permissions);
}
