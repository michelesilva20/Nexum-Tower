"use client";

import { AppOverviewPage } from "@/components/app/app-overview-page";
import { AuditAdminPage } from "@/components/app/audit-admin-page";
import { DesignSystemPage } from "@/components/app/design-system-page";
import { GroupsAdminPage } from "@/components/app/groups-admin-page";
import { BranchesAdminPage } from "@/components/app/branches-admin-page";
import { CustomersLogisticsPage } from "@/components/app/customers-logistics-page";
import { DriversLogisticsPage } from "@/components/app/drivers-logistics-page";
import { VehiclesLogisticsPage } from "@/components/app/vehicles-logistics-page";
import { LocationsLogisticsPage } from "@/components/app/locations-logistics-page";
import { PermissionsAdminPage } from "@/components/app/permissions-admin-page";
import { RolesAdminPage } from "@/components/app/roles-admin-page";
import { SecurityConsolePage } from "@/components/app/security-console-page";
import { SessionsPage } from "@/components/app/sessions-page";
import { SettingsFeaturesPage } from "@/components/app/settings-features-page";
import { SettingsHubPage } from "@/components/app/settings-hub-page";
import { SettingsParametersPage } from "@/components/app/settings-parameters-page";
import { UsersAdminPage } from "@/components/app/users-admin-page";
import { usePathname } from "@/i18n/navigation";
import { notFound } from "next/navigation";

type PageComponent = () => React.JSX.Element | null;

const routeMap: Record<string, PageComponent> = {
  "": AppOverviewPage,
  // admin (rotas novas)
  "admin/users": UsersAdminPage,
  "admin/branches": BranchesAdminPage,
  "logistics/customers": CustomersLogisticsPage,
  "logistics/locations": LocationsLogisticsPage,
  "logistics/drivers": DriversLogisticsPage,
  "logistics/vehicles": VehiclesLogisticsPage,
  "admin/groups": GroupsAdminPage,
  "admin/roles": RolesAdminPage,
  "admin/permissions": PermissionsAdminPage,
  "admin/audit": AuditAdminPage,
  // settings
  settings: SettingsHubPage,
  "settings/security": SecurityConsolePage,
  "settings/parameters": SettingsParametersPage,
  "settings/features": SettingsFeaturesPage,
  // security
  "security/sessions": SessionsPage,
  // legacy — mantém rotas antigas funcionando
  users: UsersAdminPage,
  groups: GroupsAdminPage,
  roles: RolesAdminPage,
  permissions: PermissionsAdminPage,
  audit: AuditAdminPage,
  // dev
  "design-system": DesignSystemPage,
} as const;

export function AdminSectionRouter() {
  const pathname = usePathname();

  const path = pathname.replace(/^\/app\/?/, "");
  const Page = routeMap[path];

  if (!Page) {
    notFound();
  }

  return <Page />;
}
