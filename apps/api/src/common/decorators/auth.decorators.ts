import { SetMetadata, applyDecorators } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = "permissions";
export const PERMISSIONS_MODE_KEY = "permissionsMode";

export type PermissionsMode = "all" | "any";

export const RequirePermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, "all" satisfies PermissionsMode),
  );

export const RequireAnyPermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, "any" satisfies PermissionsMode),
  );

export const CURRENT_TENANT_KEY = "currentTenant";
