import { RbacService } from "./rbac.service";
import type { PrismaService } from "../../prisma/prisma.service";

type UserShape = {
  userRoles: { role: { permissions: { permission: { key: string } }[] } }[];
  memberships: { group: { roles: { role: { permissions: { permission: { key: string } }[] } }[] } }[];
  overrides: { effect: "ALLOW" | "DENY"; permission: { key: string } }[];
};

function permission(key: string) {
  return { permission: { key } };
}

function buildUser(partial: Partial<UserShape>): UserShape {
  return {
    userRoles: partial.userRoles ?? [],
    memberships: partial.memberships ?? [],
    overrides: partial.overrides ?? [],
  };
}

function makeService(user: UserShape | null) {
  const prisma = {
    client: {
      user: { findFirst: jest.fn().mockResolvedValue(user) },
    },
  } as unknown as PrismaService;
  return new RbacService(prisma);
}

describe("RbacService.getUserPermissions", () => {
  it("resolve permissões de papel direto", async () => {
    const service = makeService(
      buildUser({ userRoles: [{ role: { permissions: [permission("users.read")] } }] }),
    );
    await expect(service.getUserPermissions("u1", "t1")).resolves.toEqual(["users.read"]);
  });

  it("resolve permissões vindas de grupo", async () => {
    const service = makeService(
      buildUser({
        memberships: [
          { group: { roles: [{ role: { permissions: [permission("groups.read")] } }] } },
        ],
      }),
    );
    await expect(service.getUserPermissions("u1", "t1")).resolves.toEqual(["groups.read"]);
  });

  it("adiciona permissão via override ALLOW", async () => {
    const service = makeService(
      buildUser({ overrides: [{ effect: "ALLOW", permission: { key: "reports.export" } }] }),
    );
    await expect(service.getUserPermissions("u1", "t1")).resolves.toEqual(["reports.export"]);
  });

  it("DENY prevalece sobre ALLOW herdado de papel", async () => {
    const service = makeService(
      buildUser({
        userRoles: [{ role: { permissions: [permission("users.read"), permission("users.delete")] } }],
        overrides: [{ effect: "DENY", permission: { key: "users.delete" } }],
      }),
    );
    const result = await service.getUserPermissions("u1", "t1");
    expect(result).toContain("users.read");
    expect(result).not.toContain("users.delete");
  });

  it("retorna vazio quando usuário não existe", async () => {
    const service = makeService(null);
    await expect(service.getUserPermissions("u1", "t1")).resolves.toEqual([]);
  });
});

describe("RbacService.userHasAnyPermission / userHasAllPermissions", () => {
  it("userHasAnyPermission true quando ao menos uma casa (via wildcard)", async () => {
    const service = makeService(
      buildUser({ userRoles: [{ role: { permissions: [permission("users.*")] } }] }),
    );
    await expect(
      service.userHasAnyPermission("u1", "t1", ["users.delete", "roles.read"]),
    ).resolves.toBe(true);
  });

  it("userHasAllPermissions false quando falta uma", async () => {
    const service = makeService(
      buildUser({ userRoles: [{ role: { permissions: [permission("users.read")] } }] }),
    );
    await expect(
      service.userHasAllPermissions("u1", "t1", ["users.read", "users.delete"]),
    ).resolves.toBe(false);
  });
});
