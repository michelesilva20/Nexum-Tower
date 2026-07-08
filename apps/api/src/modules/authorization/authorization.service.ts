import { ForbiddenException, Injectable } from "@nestjs/common";
import { hasAnyPermission } from "@nexum-tower/shared";

type TenantScoped = { tenantId: string };
type ActorLike = { tenantId: string; userId?: string; permissions?: string[] };
type RoleLike = { tenantId?: string | null; isSystem: boolean };

const GLOBAL_BRANCH_PERMISSIONS = ["branches.manage", "organization.manage", "*"];
const GLOBAL_CUSTOMER_PERMISSIONS = [
  "customers.manage",
  "logistics.manage",
  "organization.manage",
  "*",
];
const GLOBAL_LOCATION_PERMISSIONS = [
  "locations.manage",
  "logistics.manage",
  "organization.manage",
  "*",
];
const GLOBAL_DRIVER_PERMISSIONS = [
  "drivers.manage",
  "logistics.manage",
  "organization.manage",
  "*",
];
const GLOBAL_VEHICLE_PERMISSIONS = [
  "vehicles.manage",
  "logistics.manage",
  "organization.manage",
  "*",
];
const GLOBAL_ROUTE_PERMISSIONS = [
  "routes.manage",
  "logistics.manage",
  "organization.manage",
  "*",
];

/**
 * Camada ABAC / object-level authorization da Nexum Core Platform.
 *
 * O RBAC decide *o que* o usuário pode fazer; esta camada decide se ele
 * pode fazer *neste contexto* (mesmo tenant, objeto acessível, papel de
 * sistema protegido, escopo por filial, etc.). Ver docs/SECURITY-GUARDRAILS.md.
 */
@Injectable()
export class AuthorizationService {
  /** Garante que o objeto pertence ao mesmo tenant do usuário. */
  assertSameTenant(objectTenantId: string | null | undefined, userTenantId: string): void {
    if (objectTenantId == null || objectTenantId !== userTenantId) {
      throw new ForbiddenException("Recurso não pertence ao seu tenant.");
    }
  }

  /** Usuário com escopo global de filiais (admin master / owner). */
  hasGlobalBranchScope(permissions: string[]): boolean {
    return hasAnyPermission(permissions, GLOBAL_BRANCH_PERMISSIONS);
  }

  assertGlobalBranchScope(permissions: string[]): void {
    if (!this.hasGlobalBranchScope(permissions)) {
      throw new ForbiddenException("Escopo global de filiais necessário para esta operação.");
    }
  }

  hasGlobalCustomerScope(permissions: string[]): boolean {
    return hasAnyPermission(permissions, GLOBAL_CUSTOMER_PERMISSIONS);
  }

  assertGlobalCustomerScope(permissions: string[]): void {
    if (!this.hasGlobalCustomerScope(permissions)) {
      throw new ForbiddenException("Escopo global de clientes necessário para esta operação.");
    }
  }

  /** Mutação de dados globais do Customer (cadastro fiscal, status, soft delete). */
  assertCustomerGlobalMutationAllowed(permissions: string[]): void {
    this.assertGlobalCustomerScope(permissions);
  }

  /**
   * Gerenciamento de vínculos CustomerBranch — regra restritiva:
   * apenas escopo global (decisão Fase 1.1.1).
   */
  assertCustomerBranchMutationAllowed(permissions: string[]): void {
    this.assertGlobalCustomerScope(permissions);
  }

  canMutateCustomerGlobalData(permissions: string[]): boolean {
    return this.hasGlobalCustomerScope(permissions);
  }

  canManageCustomerBranches(permissions: string[]): boolean {
    return this.hasGlobalCustomerScope(permissions);
  }

  hasGlobalLocationScope(permissions: string[]): boolean {
    return hasAnyPermission(permissions, GLOBAL_LOCATION_PERMISSIONS);
  }

  assertGlobalLocationScope(permissions: string[]): void {
    if (!this.hasGlobalLocationScope(permissions)) {
      throw new ForbiddenException("Escopo global de locais necessário para esta operação.");
    }
  }

  assertLocationGlobalMutationAllowed(permissions: string[]): void {
    this.assertGlobalLocationScope(permissions);
  }

  /** Gerenciamento de vínculos LocationBranch — regra restritiva (Fase 1.2). */
  assertLocationBranchMutationAllowed(permissions: string[]): void {
    this.assertGlobalLocationScope(permissions);
  }

  canMutateLocationGlobalData(permissions: string[]): boolean {
    return this.hasGlobalLocationScope(permissions);
  }

  canManageLocationBranches(permissions: string[]): boolean {
    return this.hasGlobalLocationScope(permissions);
  }

  hasGlobalDriverScope(permissions: string[]): boolean {
    return hasAnyPermission(permissions, GLOBAL_DRIVER_PERMISSIONS);
  }

  assertGlobalDriverScope(permissions: string[]): void {
    if (!this.hasGlobalDriverScope(permissions)) {
      throw new ForbiddenException("Escopo global de motoristas necessário para esta operação.");
    }
  }

  assertDriverGlobalMutationAllowed(permissions: string[]): void {
    this.assertGlobalDriverScope(permissions);
  }

  assertDriverBranchMutationAllowed(permissions: string[]): void {
    this.assertGlobalDriverScope(permissions);
  }

  canMutateDriverGlobalData(permissions: string[]): boolean {
    return this.hasGlobalDriverScope(permissions);
  }

  canManageDriverBranches(permissions: string[]): boolean {
    return this.hasGlobalDriverScope(permissions);
  }

  hasGlobalVehicleScope(permissions: string[]): boolean {
    return hasAnyPermission(permissions, GLOBAL_VEHICLE_PERMISSIONS);
  }

  assertGlobalVehicleScope(permissions: string[]): void {
    if (!this.hasGlobalVehicleScope(permissions)) {
      throw new ForbiddenException("Escopo global de veículos necessário para esta operação.");
    }
  }

  assertVehicleGlobalMutationAllowed(permissions: string[]): void {
    this.assertGlobalVehicleScope(permissions);
  }

  assertVehicleBranchMutationAllowed(permissions: string[]): void {
    this.assertGlobalVehicleScope(permissions);
  }

  canMutateVehicleGlobalData(permissions: string[]): boolean {
    return this.hasGlobalVehicleScope(permissions);
  }

  canManageVehicleBranches(permissions: string[]): boolean {
    return this.hasGlobalVehicleScope(permissions);
  }

  hasGlobalRouteScope(permissions: string[]): boolean {
    return hasAnyPermission(permissions, GLOBAL_ROUTE_PERMISSIONS);
  }

  assertGlobalRouteScope(permissions: string[]): void {
    if (!this.hasGlobalRouteScope(permissions)) {
      throw new ForbiddenException("Escopo global de rotas necessário para esta operação.");
    }
  }

  assertRouteGlobalMutationAllowed(permissions: string[]): void {
    this.assertGlobalRouteScope(permissions);
  }

  assertRouteBranchMutationAllowed(permissions: string[]): void {
    this.assertGlobalRouteScope(permissions);
  }

  assertRoutePointsMutationAllowed(permissions: string[]): void {
    this.assertGlobalRouteScope(permissions);
  }

  canMutateRouteGlobalData(permissions: string[]): boolean {
    return this.hasGlobalRouteScope(permissions);
  }

  canManageRouteBranches(permissions: string[]): boolean {
    return this.hasGlobalRouteScope(permissions);
  }

  canManageRoutePoints(permissions: string[]): boolean {
    return this.hasGlobalRouteScope(permissions);
  }

  canAccessTenantObject(user: TenantScoped, object: TenantScoped): boolean {
    return object.tenantId === user.tenantId;
  }

  canManageUser(actor: ActorLike, targetUser: TenantScoped): boolean {
    return actor.tenantId === targetUser.tenantId;
  }

  assertCanManageUser(actor: ActorLike, targetUser: TenantScoped): void {
    if (!this.canManageUser(actor, targetUser)) {
      throw new ForbiddenException("Usuário não pertence ao seu tenant.");
    }
  }

  /** Papéis de sistema (isSystem) e de outro tenant não podem ser modificados. */
  canModifyRole(actor: ActorLike, role: RoleLike): boolean {
    if (role.isSystem) return false;
    if (role.tenantId != null && role.tenantId !== actor.tenantId) return false;
    return true;
  }

  assertCanModifyRole(actor: ActorLike, role: RoleLike): void {
    if (role.isSystem) {
      throw new ForbiddenException("Papéis de sistema não podem ser alterados ou removidos.");
    }
    if (role.tenantId != null && role.tenantId !== actor.tenantId) {
      throw new ForbiddenException("Papel não pertence ao seu tenant.");
    }
  }
}
