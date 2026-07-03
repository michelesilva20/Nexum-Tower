import { ForbiddenException, Injectable } from "@nestjs/common";

type TenantScoped = { tenantId: string };
type ActorLike = { tenantId: string; userId?: string };
type RoleLike = { tenantId?: string | null; isSystem: boolean };

/**
 * Camada ABAC / object-level authorization da Nexum Core Platform.
 *
 * O RBAC decide *o que* o usuário pode fazer; esta camada decide se ele
 * pode fazer *neste contexto* (mesmo tenant, objeto acessível, papel de
 * sistema protegido, etc.). Ver docs/SECURITY-GUARDRAILS.md.
 */
@Injectable()
export class AuthorizationService {
  /** Garante que o objeto pertence ao mesmo tenant do usuário. */
  assertSameTenant(objectTenantId: string | null | undefined, userTenantId: string): void {
    if (objectTenantId == null || objectTenantId !== userTenantId) {
      throw new ForbiddenException("Recurso não pertence ao seu tenant.");
    }
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
