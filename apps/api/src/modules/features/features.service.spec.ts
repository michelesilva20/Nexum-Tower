import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { FeaturesService } from "./features.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../../common/audit-actions";

const TENANT_ID = "tenant-1";
const USER_PAYLOAD = {
  userId: "user-1",
  sessionId: "session-1",
  tenantId: TENANT_ID,
  email: "admin@test.com",
  permissions: ["features.manage"],
};

const MOCK_FEATURE = {
  id: "feat-1",
  key: "nexum_ai.enabled",
  name: "Nexum AI",
  description: "IA operacional",
  module: "ai",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  client: {
    feature: { findMany: jest.fn(), findUnique: jest.fn() },
    tenantFeature: { findMany: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
  },
};

const mockAudit = { log: jest.fn() };

describe("FeaturesService", () => {
  let service: FeaturesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeaturesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<FeaturesService>(FeaturesService);
    jest.clearAllMocks();
  });

  describe("list()", () => {
    it("deve listar features mescladas com estado do tenant", async () => {
      mockPrisma.client.feature.findMany.mockResolvedValue([MOCK_FEATURE]);
      mockPrisma.client.tenantFeature.findMany.mockResolvedValue([
        { featureId: MOCK_FEATURE.id, enabled: true, config: null },
      ]);

      const result = await service.list(TENANT_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        key: "nexum_ai.enabled",
        enabled: true,
      });
    });
  });

  describe("setTenantFeature()", () => {
    it("deve ativar feature e gerar audit log", async () => {
      mockPrisma.client.feature.findUnique.mockResolvedValue(MOCK_FEATURE);
      mockPrisma.client.tenantFeature.findFirst.mockResolvedValue(null);
      mockPrisma.client.tenantFeature.upsert.mockResolvedValue({
        enabled: true,
        config: null,
      });

      await service.setTenantFeature(
        TENANT_ID,
        "nexum_ai.enabled",
        { enabled: true },
        USER_PAYLOAD,
        { ipAddress: "127.0.0.1" },
      );

      expect(mockPrisma.client.tenantFeature.upsert).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.FEATURE_FLAG_UPDATED,
          entityId: "nexum_ai.enabled",
          metadata: expect.objectContaining({ oldEnabled: false, newEnabled: true }),
        }),
      );
    });

    it("deve lançar NotFoundException para feature inexistente", async () => {
      mockPrisma.client.feature.findUnique.mockResolvedValue(null);

      await expect(
        service.setTenantFeature(TENANT_ID, "unknown.feature", { enabled: true }, USER_PAYLOAD, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
