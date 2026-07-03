import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SettingsService } from "./settings.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../../common/audit-actions";

const TENANT_ID = "tenant-1";
const USER_ID = "user-1";
const USER_PAYLOAD = {
  userId: USER_ID,
  sessionId: "session-1",
  tenantId: TENANT_ID,
  email: "admin@test.com",
  permissions: ["settings.update", "settings.read"],
};
const SENSITIVE_USER = {
  ...USER_PAYLOAD,
  permissions: ["settings.update", "settings.read", "settings.security.update"],
};

const MOCK_DEFINITION = {
  id: "def-1",
  key: "session_timeout",
  category: "sessions",
  valueType: "NUMBER",
  label: "Session Timeout",
  description: "Minutes",
  defaultValue: 30,
  isSensitive: false,
  isTenantScoped: true,
  options: null,
  module: "sessions",
};

const MOCK_SENSITIVE_DEF = {
  ...MOCK_DEFINITION,
  id: "def-2",
  key: "max_login_attempts",
  isSensitive: true,
};

const mockPrisma = {
  client: {
    settingDefinition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    tenantSetting: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
};

const mockAudit = { log: jest.fn() };

describe("SettingsService", () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  describe("list()", () => {
    it("deve retornar lista de definições mescladas com valores do tenant", async () => {
      mockPrisma.client.settingDefinition.findMany.mockResolvedValue([MOCK_DEFINITION]);
      mockPrisma.client.tenantSetting.findMany.mockResolvedValue([]);

      const result = await service.list(TENANT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("session_timeout");
      // sem valor de tenant, retorna undefined → valor padrão
      expect(result[0].isOverridden).toBe(false);
    });

    it("deve mesclar valor do tenant quando existir", async () => {
      mockPrisma.client.settingDefinition.findMany.mockResolvedValue([MOCK_DEFINITION]);
      mockPrisma.client.tenantSetting.findMany.mockResolvedValue([
        {
          id: "ts-1",
          definitionId: MOCK_DEFINITION.id,
          tenantId: TENANT_ID,
          value: 60,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.list(TENANT_ID);

      expect(result[0].value).toBe(60);
      expect(result[0].isOverridden).toBe(true);
    });
  });

  describe("update()", () => {
    it("deve atualizar configuração não-sensível com permissão básica", async () => {
      mockPrisma.client.settingDefinition.findUnique.mockResolvedValue(MOCK_DEFINITION);
      mockPrisma.client.tenantSetting.upsert.mockResolvedValue({
        id: "ts-1",
        tenantId: TENANT_ID,
        definitionId: MOCK_DEFINITION.id,
        value: 60,
        updatedAt: new Date(),
      });

      await service.update(TENANT_ID, "session_timeout", 60, USER_PAYLOAD, {});

      expect(mockPrisma.client.tenantSetting.upsert).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.SETTING_UPDATED }),
      );
    });

    it("deve rejeitar atualização de configuração sensível sem permissão especial", async () => {
      mockPrisma.client.settingDefinition.findUnique.mockResolvedValue(MOCK_SENSITIVE_DEF);

      await expect(
        service.update(TENANT_ID, "max_login_attempts", 5, USER_PAYLOAD, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it("deve permitir atualização de configuração sensível com permissão especial", async () => {
      mockPrisma.client.settingDefinition.findUnique.mockResolvedValue(MOCK_SENSITIVE_DEF);
      mockPrisma.client.tenantSetting.upsert.mockResolvedValue({
        id: "ts-2",
        tenantId: TENANT_ID,
        definitionId: MOCK_SENSITIVE_DEF.id,
        value: 5,
        updatedAt: new Date(),
      });

      await expect(
        service.update(TENANT_ID, "max_login_attempts", 5, SENSITIVE_USER, {}),
      ).resolves.not.toThrow();
    });

    it("deve lançar NotFoundException para chave inexistente", async () => {
      mockPrisma.client.settingDefinition.findUnique.mockResolvedValue(null);

      await expect(
        service.update(TENANT_ID, "nonexistent_key", "value", USER_PAYLOAD, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it("deve auditar atualização com action e key corretos", async () => {
      mockPrisma.client.settingDefinition.findUnique.mockResolvedValue(MOCK_DEFINITION);
      mockPrisma.client.tenantSetting.upsert.mockResolvedValue({
        id: "ts-1",
        tenantId: TENANT_ID,
        definitionId: MOCK_DEFINITION.id,
        value: 60,
        updatedAt: new Date(),
      });

      await service.update(TENANT_ID, "session_timeout", 60, USER_PAYLOAD, {});

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SETTING_UPDATED,
          entityId: MOCK_DEFINITION.key,
        }),
      );
    });

    it("deve rejeitar valor não-booleano para setting BOOLEAN", async () => {
      mockPrisma.client.settingDefinition.findUnique.mockResolvedValue({
        ...MOCK_DEFINITION,
        valueType: "BOOLEAN",
      });

      await expect(
        service.update(TENANT_ID, "session_timeout", "not-a-boolean", USER_PAYLOAD, {}),
      ).rejects.toThrow("booleano");
    });
  });
});
