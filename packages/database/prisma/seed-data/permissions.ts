export type PermissionDef = {
  key: string;
  module: string;
  resource: string;
  action: string;
  description: string;
};

export const PERMISSION_DEFINITIONS: PermissionDef[] = [
  { key: "dashboard.read", module: "dashboard", resource: "dashboard", action: "read", description: "View dashboard" },
  { key: "trips.read", module: "trips", resource: "trips", action: "read", description: "View trips" },
  { key: "trips.create", module: "trips", resource: "trips", action: "create", description: "Create trips" },
  { key: "trips.update", module: "trips", resource: "trips", action: "update", description: "Update trips" },
  { key: "trips.cancel", module: "trips", resource: "trips", action: "cancel", description: "Cancel trips" },
  { key: "trips.close", module: "trips", resource: "trips", action: "close", description: "Close trips" },
  { key: "shipments.read", module: "shipments", resource: "shipments", action: "read", description: "View shipments" },
  { key: "shipments.create", module: "shipments", resource: "shipments", action: "create", description: "Create shipments" },
  { key: "shipments.update", module: "shipments", resource: "shipments", action: "update", description: "Update shipments" },
  { key: "shipments.cancel", module: "shipments", resource: "shipments", action: "cancel", description: "Cancel shipments" },
  { key: "incidents.read", module: "incidents", resource: "incidents", action: "read", description: "View incidents" },
  { key: "incidents.create", module: "incidents", resource: "incidents", action: "create", description: "Create incidents" },
  { key: "incidents.update", module: "incidents", resource: "incidents", action: "update", description: "Update incidents" },
  { key: "incidents.assign", module: "incidents", resource: "incidents", action: "assign", description: "Assign incidents" },
  { key: "incidents.resolve", module: "incidents", resource: "incidents", action: "resolve", description: "Resolve incidents" },
  { key: "costs.read", module: "costs", resource: "costs", action: "read", description: "View costs" },
  { key: "costs.create", module: "costs", resource: "costs", action: "create", description: "Create costs" },
  { key: "costs.update", module: "costs", resource: "costs", action: "update", description: "Update costs" },
  { key: "costs.approve", module: "costs", resource: "costs", action: "approve", description: "Approve costs" },
  { key: "documents.read", module: "documents", resource: "documents", action: "read", description: "View documents" },
  { key: "documents.upload", module: "documents", resource: "documents", action: "upload", description: "Upload documents" },
  { key: "documents.approve", module: "documents", resource: "documents", action: "approve", description: "Approve documents" },
  { key: "documents.reject", module: "documents", resource: "documents", action: "reject", description: "Reject documents" },
  { key: "customers.read", module: "customers", resource: "customers", action: "read", description: "View customers" },
  { key: "customers.create", module: "customers", resource: "customers", action: "create", description: "Create customers" },
  { key: "customers.update", module: "customers", resource: "customers", action: "update", description: "Update customers" },
  { key: "customers.disable", module: "customers", resource: "customers", action: "disable", description: "Disable customers" },
  { key: "customers.delete", module: "customers", resource: "customers", action: "delete", description: "Delete customers (soft delete)" },
  { key: "customers.manage", module: "customers", resource: "customers", action: "manage", description: "Manage all customers in tenant" },
  { key: "customers.assign_branches", module: "customers", resource: "customers", action: "assign_branches", description: "Assign customer branches" },
  { key: "logistics.read", module: "logistics", resource: "logistics", action: "read", description: "View logistics module" },
  { key: "logistics.manage", module: "logistics", resource: "logistics", action: "manage", description: "Manage logistics module" },
  { key: "locations.read", module: "locations", resource: "locations", action: "read", description: "View operational locations" },
  { key: "locations.create", module: "locations", resource: "locations", action: "create", description: "Create operational locations" },
  { key: "locations.update", module: "locations", resource: "locations", action: "update", description: "Update operational locations" },
  { key: "locations.disable", module: "locations", resource: "locations", action: "disable", description: "Disable operational locations" },
  { key: "locations.delete", module: "locations", resource: "locations", action: "delete", description: "Delete operational locations (soft delete)" },
  { key: "locations.manage", module: "locations", resource: "locations", action: "manage", description: "Manage all locations in tenant" },
  { key: "locations.assign_branches", module: "locations", resource: "locations", action: "assign_branches", description: "Assign location branches" },
  { key: "drivers.read", module: "drivers", resource: "drivers", action: "read", description: "View drivers" },
  { key: "drivers.create", module: "drivers", resource: "drivers", action: "create", description: "Create drivers" },
  { key: "drivers.update", module: "drivers", resource: "drivers", action: "update", description: "Update drivers" },
  { key: "drivers.disable", module: "drivers", resource: "drivers", action: "disable", description: "Disable drivers" },
  { key: "vehicles.read", module: "vehicles", resource: "vehicles", action: "read", description: "View vehicles" },
  { key: "vehicles.create", module: "vehicles", resource: "vehicles", action: "create", description: "Create vehicles" },
  { key: "vehicles.update", module: "vehicles", resource: "vehicles", action: "update", description: "Update vehicles" },
  { key: "vehicles.disable", module: "vehicles", resource: "vehicles", action: "disable", description: "Disable vehicles" },
  { key: "reports.read", module: "reports", resource: "reports", action: "read", description: "View reports" },
  { key: "reports.export", module: "reports", resource: "reports", action: "export", description: "Export reports" },
  { key: "ai.use", module: "ai", resource: "ai", action: "use", description: "Use AI features" },
  { key: "ai.manage", module: "ai", resource: "ai", action: "manage", description: "Manage AI settings" },
  { key: "users.read", module: "users", resource: "users", action: "read", description: "View users" },
  { key: "users.create", module: "users", resource: "users", action: "create", description: "Create users" },
  { key: "users.invite", module: "users", resource: "users", action: "invite", description: "Invite users" },
  { key: "users.update", module: "users", resource: "users", action: "update", description: "Update users" },
  { key: "users.disable", module: "users", resource: "users", action: "disable", description: "Disable users" },
  { key: "users.delete", module: "users", resource: "users", action: "delete", description: "Delete users (soft delete)" },
  { key: "users.manage_roles", module: "users", resource: "users", action: "manage_roles", description: "Manage user roles" },
  { key: "users.manage_groups", module: "users", resource: "users", action: "manage_groups", description: "Manage user groups" },
  { key: "users.manage_overrides", module: "users", resource: "users", action: "manage_overrides", description: "Manage user permission overrides" },
  { key: "groups.read", module: "groups", resource: "groups", action: "read", description: "View groups" },
  { key: "groups.create", module: "groups", resource: "groups", action: "create", description: "Create groups" },
  { key: "groups.update", module: "groups", resource: "groups", action: "update", description: "Update groups" },
  { key: "groups.delete", module: "groups", resource: "groups", action: "delete", description: "Delete groups" },
  { key: "groups.manage_roles", module: "groups", resource: "groups", action: "manage_roles", description: "Manage group roles" },
  { key: "roles.read", module: "roles", resource: "roles", action: "read", description: "View roles" },
  { key: "roles.create", module: "roles", resource: "roles", action: "create", description: "Create roles" },
  { key: "roles.update", module: "roles", resource: "roles", action: "update", description: "Update roles" },
  { key: "roles.delete", module: "roles", resource: "roles", action: "delete", description: "Delete roles" },
  { key: "roles.manage_permissions", module: "roles", resource: "roles", action: "manage_permissions", description: "Manage role permissions" },
  { key: "permissions.read", module: "permissions", resource: "permissions", action: "read", description: "View permissions" },
  { key: "rbac.read", module: "rbac", resource: "rbac", action: "read", description: "View RBAC configuration" },
  { key: "rbac.manage", module: "rbac", resource: "rbac", action: "manage", description: "Manage RBAC configuration" },
  { key: "sessions.read", module: "sessions", resource: "sessions", action: "read", description: "View auth sessions" },
  { key: "sessions.revoke", module: "sessions", resource: "sessions", action: "revoke", description: "Revoke auth sessions" },
  { key: "settings.read", module: "settings", resource: "settings", action: "read", description: "View settings" },
  { key: "settings.update", module: "settings", resource: "settings", action: "update", description: "Update settings" },
  { key: "settings.security.update", module: "settings", resource: "security", action: "update", description: "Update sensitive security settings" },
  { key: "features.read", module: "features", resource: "features", action: "read", description: "View feature flags" },
  { key: "features.manage", module: "features", resource: "features", action: "manage", description: "Manage feature flags" },
  { key: "security.read", module: "security", resource: "security", action: "read", description: "View security configuration" },
  { key: "security.manage", module: "security", resource: "security", action: "manage", description: "Manage security configuration" },
  { key: "api_standards.read", module: "api_standards", resource: "api_standards", action: "read", description: "View API standards" },
  { key: "rls.read", module: "rls", resource: "rls", action: "read", description: "View RLS configuration" },
  { key: "rls.manage", module: "rls", resource: "rls", action: "manage", description: "Manage RLS configuration" },
  { key: "audit.read", module: "audit", resource: "audit", action: "read", description: "View audit logs" },
  { key: "branches.read", module: "branches", resource: "branches", action: "read", description: "View branches" },
  { key: "branches.create", module: "branches", resource: "branches", action: "create", description: "Create branches" },
  { key: "branches.update", module: "branches", resource: "branches", action: "update", description: "Update branches" },
  { key: "branches.disable", module: "branches", resource: "branches", action: "disable", description: "Disable branches" },
  { key: "branches.delete", module: "branches", resource: "branches", action: "delete", description: "Delete branches" },
  { key: "branches.manage", module: "branches", resource: "branches", action: "manage", description: "Manage all branches in tenant" },
  { key: "branches.assign_users", module: "branches", resource: "branches", action: "assign_users", description: "Assign users to branches" },
  { key: "organization.read", module: "organization", resource: "organization", action: "read", description: "View organization structure" },
  { key: "organization.manage", module: "organization", resource: "organization", action: "manage", description: "Manage organization structure" },
  { key: "client_portal.read", module: "client_portal", resource: "client_portal", action: "read", description: "Access client portal" },
  { key: "shipments.read_own", module: "shipments", resource: "shipments", action: "read_own", description: "View own shipments" },
  { key: "documents.read_own", module: "documents", resource: "documents", action: "read_own", description: "View own documents" },
  { key: "incidents.read_own", module: "incidents", resource: "incidents", action: "read_own", description: "View own incidents" },
  { key: "driver_app.read", module: "driver_app", resource: "driver_app", action: "read", description: "Access driver app" },
  { key: "trips.read_assigned", module: "trips", resource: "trips", action: "read_assigned", description: "View assigned trips" },
  { key: "incidents.create_own", module: "incidents", resource: "incidents", action: "create_own", description: "Create own incidents" },
];

export const ALL_PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((p) => p.key);

function expandPatterns(patterns: string[]): string[] {
  const result = new Set<string>();

  for (const pattern of patterns) {
    if (pattern === "*") {
      ALL_PERMISSION_KEYS.forEach((k) => result.add(k));
      continue;
    }

    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      ALL_PERMISSION_KEYS.filter((k) => k.startsWith(`${prefix}.`)).forEach((k) => result.add(k));
      continue;
    }

    if (ALL_PERMISSION_KEYS.includes(pattern)) {
      result.add(pattern);
    }
  }

  return [...result];
}

export const ROLE_DEFINITIONS = [
  {
    slug: "owner",
    name: "Owner",
    description: "Full tenant access",
    permissions: ["*"],
  },
  {
    slug: "tenant-admin",
    name: "Tenant Admin",
    description: "Manage users, groups, roles and tenant settings",
    permissions: [
      "dashboard.read",
      "users.*",
      "groups.*",
      "roles.*",
      "permissions.read",
      "rbac.*",
      "sessions.*",
      "settings.*",
      "features.*",
      "security.*",
      "rls.read",
      "audit.read",
      "branches.*",
      "organization.*",
      "customers.*",
      "locations.*",
      "logistics.*",
    ],
  },
  {
    slug: "operations-manager",
    name: "Operations Manager",
    description: "Operational management",
    permissions: [
      "dashboard.read",
      "trips.*",
      "shipments.*",
      "incidents.*",
      "documents.*",
      "customers.read",
      "customers.create",
      "customers.update",
      "customers.disable",
      "customers.assign_branches",
      "locations.read",
      "logistics.read",
      "drivers.read",
      "vehicles.read",
      "reports.read",
      "ai.use",
      "branches.read",
      "organization.read",
    ],
  },
  {
    slug: "logistics-operator",
    name: "Logistics Operator",
    description: "Day-to-day logistics operations",
    permissions: [
      "dashboard.read",
      "trips.read",
      "trips.create",
      "trips.update",
      "shipments.read",
      "shipments.create",
      "shipments.update",
      "incidents.read",
      "incidents.create",
      "incidents.update",
      "documents.read",
      "documents.upload",
      "drivers.read",
      "vehicles.read",
      "customers.read",
      "locations.read",
      "logistics.read",
      "branches.read",
      "organization.read",
    ],
  },
  {
    slug: "finance-analyst",
    name: "Finance Analyst",
    description: "Financial analysis and reporting",
    permissions: [
      "dashboard.read",
      "costs.read",
      "costs.create",
      "costs.update",
      "reports.read",
      "reports.export",
      "trips.read",
      "customers.read",
    ],
  },
  {
    slug: "customer-user",
    name: "Customer User",
    description: "Customer portal access",
    permissions: [
      "client_portal.read",
      "shipments.read_own",
      "documents.read_own",
      "incidents.read_own",
    ],
  },
  {
    slug: "driver",
    name: "Driver",
    description: "Driver app access",
    permissions: [
      "driver_app.read",
      "trips.read_assigned",
      "documents.upload",
      "incidents.create_own",
    ],
  },
  {
    slug: "viewer",
    name: "Viewer",
    description: "Read-only access",
    permissions: [
      "dashboard.read",
      "trips.read",
      "shipments.read",
      "incidents.read",
      "customers.read",
      "locations.read",
      "drivers.read",
      "vehicles.read",
      "reports.read",
    ],
  },
] as const;

export function getRolePermissionKeys(slug: string): string[] {
  const role = ROLE_DEFINITIONS.find((r) => r.slug === slug);
  if (!role) return [];
  return expandPatterns([...role.permissions]);
}

export const GROUP_DEFINITIONS = [
  { slug: "administradores", name: "Administradores", roleSlug: "tenant-admin" },
  { slug: "operacao", name: "Operação", roleSlug: "operations-manager" },
  { slug: "financeiro", name: "Financeiro", roleSlug: "finance-analyst" },
  { slug: "clientes", name: "Clientes", roleSlug: "customer-user" },
  { slug: "motoristas", name: "Motoristas", roleSlug: "driver" },
  { slug: "visualizadores", name: "Visualizadores", roleSlug: "viewer" },
] as const;
