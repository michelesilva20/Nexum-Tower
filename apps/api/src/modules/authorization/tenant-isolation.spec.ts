/**
 * Testes de isolamento multi-tenant via AuthorizationService (ABAC).
 *
 * Esses testes validam que a camada ABAC garante isolamento de objetos
 * entre tenants diferentes. O isolamento em banco (RLS) é validado
 * manualmente via packages/database/prisma/rls-test.sql.
 */

import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthorizationService } from "./authorization.service";

const TENANT_A = "tenant-a";
const TENANT_B = "tenant-b";

const actorA = { sub: "user-1", tenantId: TENANT_A, email: "a@a.com", permissions: [] };
const actorB = { sub: "user-2", tenantId: TENANT_B, email: "b@b.com", permissions: [] };

describe("AuthorizationService — Tenant Isolation", () => {
  let service: AuthorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationService],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  describe("assertSameTenant(objectTenantId, userTenantId)", () => {
    it("não deve lançar erro quando IDs de tenant coincidem", () => {
      expect(() => service.assertSameTenant(TENANT_A, TENANT_A)).not.toThrow();
    });

    it("deve lançar ForbiddenException quando tenants são diferentes", () => {
      expect(() => service.assertSameTenant(TENANT_B, TENANT_A)).toThrow(ForbiddenException);
    });

    it("deve lançar ForbiddenException quando objectTenantId é null", () => {
      expect(() => service.assertSameTenant(null, TENANT_A)).toThrow(ForbiddenException);
    });

    it("deve lançar ForbiddenException quando objectTenantId é undefined", () => {
      expect(() => service.assertSameTenant(undefined, TENANT_A)).toThrow(ForbiddenException);
    });
  });

  describe("canAccessTenantObject(user, object)", () => {
    const objectFromA = { tenantId: TENANT_A };
    const objectFromB = { tenantId: TENANT_B };

    it("deve retornar true quando usuário e objeto pertencem ao mesmo tenant", () => {
      expect(service.canAccessTenantObject(actorA, objectFromA)).toBe(true);
    });

    it("deve retornar false quando usuário pertence a tenant diferente do objeto", () => {
      expect(service.canAccessTenantObject(actorA, objectFromB)).toBe(false);
    });

    it("tenant B não deve enxergar dados do tenant A", () => {
      expect(service.canAccessTenantObject(actorB, objectFromA)).toBe(false);
    });

    it("tenant A não deve enxergar dados do tenant B", () => {
      expect(service.canAccessTenantObject(actorA, objectFromB)).toBe(false);
    });
  });

  describe("canManageUser(actor, targetUser)", () => {
    const userSameTenant = { tenantId: TENANT_A };
    const userOtherTenant = { tenantId: TENANT_B };

    it("deve permitir gerenciar usuário do mesmo tenant", () => {
      expect(service.canManageUser(actorA, userSameTenant)).toBe(true);
    });

    it("deve negar gerenciar usuário de outro tenant", () => {
      expect(service.canManageUser(actorA, userOtherTenant)).toBe(false);
    });
  });

  describe("canModifyRole(actor, role)", () => {
    it("deve negar modificar role de sistema", () => {
      expect(service.canModifyRole(actorA, { isSystem: true })).toBe(false);
    });

    it("deve permitir modificar role customizada do mesmo tenant", () => {
      expect(service.canModifyRole(actorA, { isSystem: false, tenantId: TENANT_A })).toBe(true);
    });

    it("deve negar modificar role de outro tenant", () => {
      expect(service.canModifyRole(actorA, { isSystem: false, tenantId: TENANT_B })).toBe(false);
    });
  });

  describe("cenários cross-tenant", () => {
    it("assertSameTenant bloqueia acesso cross-tenant bilateral", () => {
      expect(() => service.assertSameTenant(TENANT_B, TENANT_A)).toThrow(ForbiddenException);
      expect(() => service.assertSameTenant(TENANT_A, TENANT_B)).toThrow(ForbiddenException);
    });

    it("assertCanManageUser bloqueia gerenciamento de usuário de outro tenant", () => {
      const userB = { tenantId: TENANT_B };
      expect(() => service.assertCanManageUser(actorA, userB)).toThrow(ForbiddenException);
    });
  });
});
