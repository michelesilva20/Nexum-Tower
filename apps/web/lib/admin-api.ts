import { apiRequest } from "./api";

// ─── Tipos básicos ───────────────────────────────────────────────────────────

export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  tenant?: { id: string; name: string };
  roles?: { role: { id: string; name: string; slug: string } }[];
  groups?: { group: { id: string; name: string; slug: string } }[];
};

export type UserDetail = UserRow & {
  roles: { role: { id: string; name: string; slug: string } }[];
  groups: { group: { id: string; name: string; slug: string } }[];
  overrides: PermissionOverride[];
};

export type PermissionOverride = {
  id: string;
  effect: "ALLOW" | "DENY";
  reason: string | null;
  permission: { id: string; key: string; description: string | null };
};

export type EffectivePermissionsResult = {
  permissions: string[];
  details: {
    key: string;
    source: "role" | "group" | "override";
    effect: "ALLOW" | "DENY";
  }[];
};

export type RoleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: { id: string; key: string; description: string | null } }[];
  _count?: { users: number; groups: number };
};

export type GroupRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  roles: { role: { id: string; name: string; slug: string } }[];
  _count?: { members: number };
};

export type GroupMember = {
  id: string;
  user: { id: string; name: string; email: string; status: string };
  joinedAt: string;
};

export type PermissionRow = {
  id: string;
  key: string;
  module: string;
  resource: string;
  action: string;
  description: string | null;
};

export type AuditLogRow = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  requestId: string | null;
  userAgent: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

export type SessionRow = {
  id: string;
  isCurrent: boolean;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  user?: { id: string; name: string; email: string };
};

export type SettingRow = {
  id: string;
  key: string;
  category: string;
  valueType: "BOOLEAN" | "NUMBER" | "STRING" | "SELECT" | "JSON";
  label: string;
  description: string | null;
  defaultValue: unknown;
  isSensitive: boolean;
  options: unknown;
  tenantValue: {
    id: string;
    value: unknown;
    updatedAt: string;
  } | null;
};

export type FeatureRow = {
  id: string;
  key: string;
  module: string;
  label: string;
  description: string | null;
  defaultEnabled: boolean;
  tenantFeature: {
    id: string;
    enabled: boolean;
    config: unknown;
    updatedAt: string;
  } | null;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

// ─── Usuários ────────────────────────────────────────────────────────────────

export function fetchUsers(params?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const qs = buildQuery({ ...params });
  return apiRequest<UserRow[]>(`/users${qs}`);
}

export function fetchUserById(id: string) {
  return apiRequest<UserDetail>(`/users/${id}`);
}

export function createUser(data: { name: string; email: string; password?: string }) {
  return apiRequest<UserRow>("/users", { method: "POST", body: JSON.stringify(data) });
}

export function updateUser(id: string, data: { name?: string; email?: string }) {
  return apiRequest<UserRow>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function disableUser(id: string) {
  return apiRequest<UserRow>(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "DISABLED" }),
  });
}

export function activateUser(id: string) {
  return apiRequest<UserRow>(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ACTIVE" }),
  });
}

export function deleteUser(id: string) {
  return apiRequest<{ success: boolean }>(`/users/${id}`, { method: "DELETE" });
}

export function fetchUserEffectivePermissions(id: string) {
  return apiRequest<EffectivePermissionsResult>(`/users/${id}/effective-permissions`);
}

export function addUserRole(userId: string, roleId: string) {
  return apiRequest<UserRow>(`/users/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify({ roleId }),
  });
}

export function removeUserRole(userId: string, roleId: string) {
  return apiRequest<UserRow>(`/users/${userId}/roles/${roleId}`, { method: "DELETE" });
}

export function addUserGroup(userId: string, groupId: string) {
  return apiRequest<UserRow>(`/users/${userId}/groups`, {
    method: "POST",
    body: JSON.stringify({ groupId }),
  });
}

export function removeUserGroup(userId: string, groupId: string) {
  return apiRequest<UserRow>(`/users/${userId}/groups/${groupId}`, { method: "DELETE" });
}

export function addUserOverride(
  userId: string,
  data: { permissionId: string; effect: "ALLOW" | "DENY"; reason?: string },
) {
  return apiRequest<PermissionOverride>(`/users/${userId}/overrides`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function removeUserOverride(userId: string, overrideId: string) {
  return apiRequest<{ success: boolean }>(`/users/${userId}/overrides/${overrideId}`, {
    method: "DELETE",
  });
}

// ─── Grupos ─────────────────────────────────────────────────────────────────

export function fetchGroups(params?: { search?: string }) {
  const qs = buildQuery({ ...params });
  return apiRequest<GroupRow[]>(`/groups${qs}`);
}

export function fetchGroupById(id: string) {
  return apiRequest<GroupRow>(`/groups/${id}`);
}

export function fetchGroupMembers(id: string) {
  return apiRequest<GroupMember[]>(`/groups/${id}/members`);
}

export function createGroup(data: { name: string; description?: string }) {
  return apiRequest<GroupRow>("/groups", { method: "POST", body: JSON.stringify(data) });
}

export function updateGroup(id: string, data: { name?: string; description?: string }) {
  return apiRequest<GroupRow>(`/groups/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteGroup(id: string) {
  return apiRequest<{ success: boolean }>(`/groups/${id}`, { method: "DELETE" });
}

export function addGroupRole(groupId: string, roleId: string) {
  return apiRequest<GroupRow>(`/groups/${groupId}/roles`, {
    method: "POST",
    body: JSON.stringify({ roleId }),
  });
}

export function removeGroupRole(groupId: string, roleId: string) {
  return apiRequest<GroupRow>(`/groups/${groupId}/roles/${roleId}`, { method: "DELETE" });
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export function fetchRoles(params?: { search?: string }) {
  const qs = buildQuery({ ...params });
  return apiRequest<RoleRow[]>(`/roles${qs}`);
}

export function fetchRoleById(id: string) {
  return apiRequest<RoleRow>(`/roles/${id}`);
}

export function createRole(data: { name: string; description?: string }) {
  return apiRequest<RoleRow>("/roles", { method: "POST", body: JSON.stringify(data) });
}

export function updateRole(id: string, data: { name?: string; description?: string }) {
  return apiRequest<RoleRow>(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteRole(id: string) {
  return apiRequest<{ success: boolean }>(`/roles/${id}`, { method: "DELETE" });
}

export function addRolePermission(roleId: string, permissionId: string) {
  return apiRequest<RoleRow>(`/roles/${roleId}/permissions`, {
    method: "POST",
    body: JSON.stringify({ permissionId }),
  });
}

export function removeRolePermission(roleId: string, permissionId: string) {
  return apiRequest<RoleRow>(`/roles/${roleId}/permissions/${permissionId}`, { method: "DELETE" });
}

// ─── Permissões ──────────────────────────────────────────────────────────────

export function fetchPermissions(params?: { module?: string; search?: string }) {
  const qs = buildQuery({ ...params });
  return apiRequest<PermissionRow[]>(`/permissions${qs}`);
}

export function fetchPermissionModules() {
  return apiRequest<{ module: string; count: number }[]>("/permissions/modules");
}

// ─── Auditoria ───────────────────────────────────────────────────────────────

export function fetchAuditLogs(params?: {
  action?: string;
  userId?: string;
  entity?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}) {
  const qs = buildQuery({ ...params });
  return apiRequest<AuditLogRow[]>(`/audit/logs${qs}`);
}

export function fetchAuditLogById(id: string) {
  return apiRequest<AuditLogRow>(`/audit/${id}`);
}

// ─── Sessões ─────────────────────────────────────────────────────────────────

export function fetchSessions() {
  return apiRequest<SessionRow[]>("/auth/sessions");
}

export function revokeSession(sessionId: string) {
  return apiRequest<{ success: boolean }>(`/auth/sessions/${sessionId}`, { method: "DELETE" });
}

export function revokeAllSessions() {
  return apiRequest<{ revoked: number }>("/auth/logout-all", { method: "POST" });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function fetchSettings(params?: { category?: string; search?: string }) {
  const qs = buildQuery({ ...params });
  return apiRequest<SettingRow[]>(`/settings${qs}`);
}

export function updateSetting(key: string, value: unknown) {
  return apiRequest<SettingRow>(`/settings/${key}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

export function fetchFeatures(params?: { module?: string }) {
  const qs = buildQuery({ ...params });
  return apiRequest<FeatureRow[]>(`/features${qs}`);
}

export function updateFeature(
  key: string,
  data: { enabled?: boolean; config?: Record<string, unknown> },
) {
  return apiRequest<FeatureRow>(`/features/${key}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
