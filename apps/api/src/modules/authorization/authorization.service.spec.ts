import { ForbiddenException } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service";

describe("AuthorizationService", () => {
  const service = new AuthorizationService();

  describe("assertSameTenant", () => {
    it("passa quando os tenants coincidem", () => {
      expect(() => service.assertSameTenant("t1", "t1")).not.toThrow();
    });

    it("bloqueia quando os tenants divergem", () => {
      expect(() => service.assertSameTenant("t2", "t1")).toThrow(ForbiddenException);
    });

    it("bloqueia quando o tenant do objeto é nulo", () => {
      expect(() => service.assertSameTenant(null, "t1")).toThrow(ForbiddenException);
    });
  });

  describe("canManageUser", () => {
    it("permite gerenciar usuário do mesmo tenant", () => {
      expect(service.canManageUser({ tenantId: "t1" }, { tenantId: "t1" })).toBe(true);
    });

    it("nega usuário de outro tenant", () => {
      expect(service.canManageUser({ tenantId: "t1" }, { tenantId: "t2" })).toBe(false);
    });
  });

  describe("canModifyRole / assertCanModifyRole", () => {
    it("bloqueia papel de sistema", () => {
      const role = { tenantId: "t1", isSystem: true };
      expect(service.canModifyRole({ tenantId: "t1" }, role)).toBe(false);
      expect(() => service.assertCanModifyRole({ tenantId: "t1" }, role)).toThrow(ForbiddenException);
    });

    it("bloqueia papel de outro tenant", () => {
      const role = { tenantId: "t2", isSystem: false };
      expect(service.canModifyRole({ tenantId: "t1" }, role)).toBe(false);
      expect(() => service.assertCanModifyRole({ tenantId: "t1" }, role)).toThrow(ForbiddenException);
    });

    it("permite papel comum do próprio tenant", () => {
      const role = { tenantId: "t1", isSystem: false };
      expect(service.canModifyRole({ tenantId: "t1" }, role)).toBe(true);
      expect(() => service.assertCanModifyRole({ tenantId: "t1" }, role)).not.toThrow();
    });
  });
});
