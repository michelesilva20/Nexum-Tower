import { Test, TestingModule } from "@nestjs/testing";
import { AuditService } from "./audit.service";
import { PrismaService } from "../../prisma/prisma.service";

const TENANT_ID = "tenant-1";

const mockPrisma = {
  client: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
};

describe("AuditService", () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe("log()", () => {
    it("deve registrar ação sensível sem salvar senha ou token", async () => {
      mockPrisma.client.auditLog.create.mockResolvedValue({ id: "log-1" });

      await service.log({
        tenantId: TENANT_ID,
        userId: "user-1",
        action: "USER_UPDATED",
        entity: "User",
        entityId: "user-1",
        metadata: {
          field: "name",
          password: "must-not-be-logged",
          accessToken: "must-not-be-logged",
        },
        ipAddress: "127.0.0.1",
        userAgent: "jest",
      });

      expect(mockPrisma.client.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          action: "USER_UPDATED",
          entity: "User",
        }),
      });

      const call = mockPrisma.client.auditLog.create.mock.calls[0][0];
      expect(call.data.metadata).toEqual(
        expect.objectContaining({ field: "name" }),
      );
    });
  });

  describe("listLogs()", () => {
    it("deve filtrar logs pelo tenantId", async () => {
      mockPrisma.client.auditLog.findMany.mockResolvedValue([]);

      await service.listLogs(TENANT_ID, { action: "LOGIN_SUCCESS" });

      expect(mockPrisma.client.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
            action: "LOGIN_SUCCESS",
          }),
        }),
      );
    });

    it("deve suportar paginação", async () => {
      mockPrisma.client.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.client.auditLog.count.mockResolvedValue(0);

      const result = await service.listLogs(TENANT_ID, { page: 1, perPage: 10 });

      expect(result).toMatchObject({
        items: [],
        page: 1,
        perPage: 10,
        total: 0,
      });
    });
  });
});
