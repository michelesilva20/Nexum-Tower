import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import type { PrismaService } from "../../prisma/prisma.service";
import type { JwtService } from "@nestjs/jwt";
import type { ConfigService } from "@nestjs/config";
import type { RbacService } from "../rbac/rbac.service";
import type { AuditService } from "../audit/audit.service";

jest.mock("bcrypt");

const mockedCompare = bcrypt.compare as unknown as jest.Mock;

function setup() {
  const prisma = {
    client: {
      user: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      authSession: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    },
  } as unknown as PrismaService;

  const jwt = { signAsync: jest.fn().mockResolvedValue("access-token") } as unknown as JwtService;
  const config = { get: jest.fn((_key: string, def?: unknown) => def) } as unknown as ConfigService;
  const rbac = {
    getUserPermissions: jest.fn().mockResolvedValue(["dashboard.read"]),
    getUserRoles: jest.fn().mockResolvedValue(["owner"]),
    getUserGroups: jest.fn().mockResolvedValue([]),
  } as unknown as RbacService;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  const service = new AuthService(prisma, jwt, config, rbac, audit);
  return { service, prisma, jwt, rbac, audit };
}

describe("AuthService.login", () => {
  it("autentica com credenciais válidas e cria sessão", async () => {
    const { service, prisma, audit } = setup();
    const client = prisma.client as unknown as {
      user: { findFirst: jest.Mock };
      authSession: { create: jest.Mock };
    };

    client.user.findFirst
      .mockResolvedValueOnce({
        id: "u1",
        tenantId: "t1",
        email: "admin@x.com",
        passwordHash: "hash",
        status: "ACTIVE",
        tenant: { id: "t1", name: "Tenant", slug: "tenant" },
      })
      .mockResolvedValueOnce({
        id: "u1",
        name: "Admin",
        email: "admin@x.com",
        tenant: { id: "t1", name: "Tenant", slug: "tenant" },
      });
    client.authSession.create.mockResolvedValue({ id: "s1" });
    mockedCompare.mockResolvedValue(true);

    const result = await service.login("Admin@x.com", "secret", {});

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).toEqual(
      expect.objectContaining({ id: "u1", email: "admin@x.com", roles: ["owner"] }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "LOGIN_SUCCESS" }),
    );
  });

  it("rejeita e audita quando o usuário não existe", async () => {
    const { service, prisma, audit } = setup();
    (prisma.client as unknown as { user: { findFirst: jest.Mock } }).user.findFirst.mockResolvedValue(
      null,
    );

    await expect(service.login("nope@x.com", "x", {})).rejects.toThrow(UnauthorizedException);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: "LOGIN_FAILED" }));
  });

  it("rejeita quando a senha está incorreta", async () => {
    const { service, prisma, audit } = setup();
    (prisma.client as unknown as { user: { findFirst: jest.Mock } }).user.findFirst.mockResolvedValue({
      id: "u1",
      tenantId: "t1",
      email: "admin@x.com",
      passwordHash: "hash",
      status: "ACTIVE",
      tenant: { id: "t1", name: "Tenant", slug: "tenant" },
    });
    mockedCompare.mockResolvedValue(false);

    await expect(service.login("admin@x.com", "wrong", {})).rejects.toThrow(UnauthorizedException);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: "LOGIN_FAILED" }));
  });
});

describe("AuthService.refresh", () => {
  it("rejeita refresh token inválido", async () => {
    const { service, prisma } = setup();
    (
      prisma.client as unknown as { authSession: { findFirst: jest.Mock } }
    ).authSession.findFirst.mockResolvedValue(null);

    await expect(service.refresh("bad-token", {})).rejects.toThrow(UnauthorizedException);
  });
});

describe("AuthService.logout", () => {
  it("revoga sessão e audita LOGOUT", async () => {
    const { service, prisma, audit } = setup();
    const client = prisma.client as unknown as {
      authSession: { updateMany: jest.Mock };
    };
    client.authSession.updateMany.mockResolvedValue({ count: 1 });

    await service.logout("session-1", "u1", "t1", { ipAddress: "127.0.0.1" });

    expect(client.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "session-1", userId: "u1", tenantId: "t1" }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: "LOGOUT" }));
  });
});

describe("AuthService.logoutByRefreshToken", () => {
  it("ignora silenciosamente refresh token inválido", async () => {
    const { service, prisma, audit } = setup();
    (prisma.client as unknown as { authSession: { findFirst: jest.Mock } }).authSession.findFirst.mockResolvedValue(
      null,
    );

    await expect(service.logoutByRefreshToken("invalid", {})).resolves.toBeUndefined();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
