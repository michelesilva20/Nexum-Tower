import { permissionMatches } from "@nexum-tower/shared";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Brain,
  Building2,
  ClipboardList,
  FileCheck,
  Flag,
  KeyRound,
  LayoutDashboard,
  Map,
  MapPin,
  Monitor,
  Package,
  Radio,
  Route,
  Settings,
  Settings2,
  Shield,
  ShieldCheck,
  Sliders,
  Truck,
  UserCog,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

export type AppNavItem = {
  key: string;
  href?: string;
  icon: LucideIcon;
  /** Permissão exigida (frontend esconde por UX; backend é a fonte real de segurança) */
  requiredPermission?: string;
  /** Qualquer uma dessas permissões é suficiente */
  requiredAnyPermission?: string[];
  /** Feature flag exigida */
  requiredFeature?: string;
  comingSoon?: boolean;
};

export type AppNavGroup = {
  key: string;
  items: AppNavItem[];
};

export const appNavigation: AppNavGroup[] = [
  {
    key: "operational",
    items: [
      {
        key: "commandCenter",
        href: "/app",
        icon: LayoutDashboard,
        requiredPermission: "dashboard.read",
      },
      { key: "controlTower", icon: Radio, comingSoon: true },
      { key: "trips", icon: Truck, comingSoon: true },
      { key: "loads", icon: Package, comingSoon: true },
      { key: "incidents", icon: Activity, comingSoon: true },
      { key: "operationalMap", icon: Map, comingSoon: true },
    ],
  },
  {
    key: "logistics",
    items: [
      {
        key: "customers",
        href: "/app/logistics/customers",
        icon: Users,
        requiredAnyPermission: ["customers.read", "logistics.read"],
      },
      {
        key: "locations",
        href: "/app/logistics/locations",
        icon: MapPin,
        requiredAnyPermission: ["locations.read", "logistics.read"],
      },
    ],
  },
  {
    key: "management",
    items: [
      { key: "clients", icon: Users, comingSoon: true },
      { key: "fleet", icon: Truck, comingSoon: true },
      { key: "drivers", icon: UserCog, comingSoon: true },
      { key: "vehicles", icon: Truck, comingSoon: true },
      { key: "routes", icon: Route, comingSoon: true },
      { key: "proofs", icon: FileCheck, comingSoon: true },
    ],
  },
  {
    key: "intelligence",
    items: [
      { key: "costs", icon: Wallet, comingSoon: true },
      { key: "reports", icon: BarChart3, comingSoon: true },
      { key: "nexumAi", icon: Brain, comingSoon: true },
      { key: "indicators", icon: Activity, comingSoon: true },
    ],
  },
  {
    key: "administration",
    items: [
      {
        key: "users",
        href: "/app/admin/users",
        icon: Users,
        requiredPermission: "users.read",
      },
      {
        key: "branches",
        href: "/app/admin/branches",
        icon: Building2,
        requiredPermission: "branches.read",
      },
      {
        key: "groups",
        href: "/app/admin/groups",
        icon: UsersRound,
        requiredPermission: "groups.read",
      },
      {
        key: "roles",
        href: "/app/admin/roles",
        icon: Shield,
        requiredPermission: "roles.read",
      },
      {
        key: "permissions",
        href: "/app/admin/permissions",
        icon: KeyRound,
        requiredPermission: "permissions.read",
      },
      {
        key: "audit",
        href: "/app/admin/audit",
        icon: ClipboardList,
        requiredPermission: "audit.read",
      },
    ],
  },
  {
    key: "configuration",
    items: [
      {
        key: "settings",
        href: "/app/settings",
        icon: Settings,
        requiredPermission: "settings.read",
      },
      {
        key: "features",
        href: "/app/settings/features",
        icon: Flag,
        requiredPermission: "features.read",
      },
      {
        key: "parameters",
        href: "/app/settings/parameters",
        icon: Sliders,
        requiredPermission: "settings.read",
      },
      {
        key: "sessions",
        href: "/app/security/sessions",
        icon: Monitor,
        requiredPermission: "sessions.read",
      },
      {
        key: "securityConsole",
        href: "/app/settings/security",
        icon: ShieldCheck,
        requiredPermission: "security.read",
      },
    ],
  },
];

export const allNavHrefs = appNavigation
  .flatMap((g) => g.items)
  .map((i) => i.href)
  .filter((href): href is string => !!href);

/** Filtra itens visíveis com base nas permissões e feature flags do usuário. */
export function getVisibleNavigation(userPermissions?: string[]): AppNavGroup[] {
  return appNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.comingSoon) return false;
        if (!item.requiredPermission && !item.requiredAnyPermission) return true;
        if (!userPermissions) return false;
        if (item.requiredPermission) {
          return permissionMatches(userPermissions, item.requiredPermission);
        }
        if (item.requiredAnyPermission) {
          return item.requiredAnyPermission.some((p) =>
            permissionMatches(userPermissions, p),
          );
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/** Ícone e label de Settings secundário para sub-páginas */
export const settingsSubNav: { key: string; href: string; icon: LucideIcon; permission?: string }[] =
  [
    { key: "hub", href: "/app/settings", icon: Settings2 },
    {
      key: "security",
      href: "/app/settings/security",
      icon: ShieldCheck,
      permission: "security.read",
    },
    {
      key: "parameters",
      href: "/app/settings/parameters",
      icon: Sliders,
      permission: "settings.read",
    },
    { key: "features", href: "/app/settings/features", icon: Flag, permission: "features.read" },
  ];
