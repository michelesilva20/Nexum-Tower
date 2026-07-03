import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "./permissions.guard";
import { PERMISSIONS_KEY, PERMISSIONS_MODE_KEY } from "../../../common/decorators/auth.decorators";
import type { AuditService } from "../../audit/audit.service";

function makeContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, ip: "127.0.0.1", headers: {} }),
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeReflector(required: string[] | undefined, mode: "all" | "any" = "all"): Reflector {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === PERMISSIONS_KEY) return required;
      if (key === PERMISSIONS_MODE_KEY) return mode;
      return undefined;
    }),
  } as unknown as Reflector;
}

describe("PermissionsGuard", () => {
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  it("libera quando nenhuma permissão é exigida", async () => {
    const guard = new PermissionsGuard(makeReflector(undefined), audit);
    await expect(guard.canActivate(makeContext(undefined))).resolves.toBe(true);
  });

  it("libera quando o usuário possui a permissão (modo all)", async () => {
    const guard = new PermissionsGuard(makeReflector(["users.read"]), audit);
    const ctx = makeContext({ userId: "u1", tenantId: "t1", permissions: ["users.read"] });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("bloqueia (403) e audita quando falta permissão", async () => {
    const guard = new PermissionsGuard(makeReflector(["users.delete"]), audit);
    const ctx = makeContext({ userId: "u1", tenantId: "t1", permissions: ["users.read"] });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PERMISSION_DENIED" }),
    );
  });

  it("modo any libera com uma das permissões", async () => {
    const guard = new PermissionsGuard(makeReflector(["users.delete", "users.read"], "any"), audit);
    const ctx = makeContext({ userId: "u1", tenantId: "t1", permissions: ["users.read"] });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("bloqueia sem usuário autenticado", async () => {
    const guard = new PermissionsGuard(makeReflector(["users.read"]), audit);
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(ForbiddenException);
  });
});
