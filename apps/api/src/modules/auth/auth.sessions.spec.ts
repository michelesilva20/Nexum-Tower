import { NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../../common/audit-actions";
import { ConfigService } from "@nestjs/config";
import { RbacService } from "../rbac/rbac.service";

const TENANT_ID = "tenant-1";
const USER_ID = "user-1";
const SESSION_ID = "session-1";

const mockPrisma = {
  client: {
    authSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    refreshToken: { findUnique: jest.fn(), updateMany: jest.fn() },
  },
};

const mockJwt = { sign: jest.fn().mockReturnValue("mock-token"), verify: jest.fn() };
const mockAudit = { log: jest.fn() };
const mockConfig = {
  get: jest.fn((key: string, defaultVal?: string) => {
    const cfg: Record<string, string> = {
      JWT_EXPIRES_IN: "15m",
      REFRESH_TOKEN_EXPIRES_IN: "7d",
    };
    return cfg[key] ?? defaultVal;
  }),
};
const mockRbac = { getUserPermissions: jest.fn().mockResolvedValue([]) };

describe("AuthService — Session Management", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RbacService, useValue: mockRbac },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe("listSessions()", () => {
    it("deve listar sessões do usuário no tenant", async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 3600000);

      mockPrisma.client.authSession.findMany.mockResolvedValue([
        {
          id: SESSION_ID,
          userId: USER_ID,
          tenantId: TENANT_ID,
          revokedAt: null,
          expiresAt: future,
          createdAt: now,
          userAgent: "Chrome",
          ipAddress: "127.0.0.1",
        },
      ]);

      const sessions = await service.listSessions(USER_ID, TENANT_ID, SESSION_ID);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(SESSION_ID);
    });
  });

  describe("revokeSession()", () => {
    it("deve revogar sessão do próprio usuário (updateMany com filtro)", async () => {
      mockPrisma.client.authSession.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeSession(SESSION_ID, USER_ID, TENANT_ID, {});

      expect(mockPrisma.client.authSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: SESSION_ID,
            userId: USER_ID,
            tenantId: TENANT_ID,
            revokedAt: null,
          }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.SESSION_REVOKED }),
      );
    });

    it("deve lançar NotFoundException quando sessão não pertence ao usuário/tenant (count=0)", async () => {
      // Sessão de outro tenant → count=0 → NotFoundException
      mockPrisma.client.authSession.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.revokeSession("other-session", USER_ID, TENANT_ID, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("revokeAllSessions()", () => {
    it("deve revogar todas as sessões ativas do usuário no tenant", async () => {
      mockPrisma.client.authSession.updateMany.mockResolvedValue({ count: 3 });

      await service.revokeAllSessions(USER_ID, TENANT_ID, {});

      expect(mockPrisma.client.authSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: USER_ID,
            tenantId: TENANT_ID,
            revokedAt: null,
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.LOGOUT_ALL }),
      );
    });
  });
});
