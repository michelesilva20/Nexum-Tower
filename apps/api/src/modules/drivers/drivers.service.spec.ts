import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuditAction } from "../../common/audit-actions";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthorizationService } from "../authorization/authorization.service";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { DriversService } from "./drivers.service";

const TENANT_ID = "tenant-1";
const DRIVER_ID = "driver-1";
const BRANCH_ID = "branch-1";
const BRANCH_ID_2 = "branch-2";
const USER_ID = "user-1";

const ACTOR_GLOBAL: AuthUserPayload = {
  userId: USER_ID,
  tenantId: TENANT_ID,
  sessionId: "s1",
  email: "admin@test.local",
  permissions: ["*"],
};

const ACTOR_SCOPED: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["drivers.read", "drivers.create", "drivers.update"],
};

const ACTOR_SCOPED_ASSIGN: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["drivers.read", "drivers.assign_branches"],
};

const ACTOR_SCOPED_READ: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["drivers.read"],
};

const DRIVER_ROW = {
  id: DRIVER_ID,
  tenantId: TENANT_ID,
  code: "MOT001",
  fullName: "João Silva",
  preferredName: "João",
  driverType: "INTERNAL" as const,
  employmentType: "EMPLOYEE" as const,
  documentType: "CPF" as const,
  documentNumber: "12345678901",
  licenseNumber: "12345678900",
  licenseCategory: "E" as const,
  licenseState: "SP",
  licenseCountry: "BR",
  licenseIssuedAt: new Date("2020-01-01"),
  licenseExpiresAt: new Date("2030-01-01"),
  hasEar: false,
  moppCertified: false,
  moppExpiresAt: null,
  birthDate: new Date("1985-05-15"),
  email: "joao@test.local",
  phone: "11999999999",
  whatsapp: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  emergencyContactRelation: null,
  addressLine1: "Rua A, 100",
  addressLine2: null,
  district: null,
  city: "São Paulo",
  state: "SP",
  country: "BR",
  zipCode: null,
  admissionDate: new Date("2022-01-01"),
  terminationDate: null,
  contractorCompanyName: null,
  availabilityStatus: "AVAILABLE" as const,
  status: "ACTIVE" as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  disabledAt: null,
  deletedAt: null,
  branches: [
    {
      id: "link-1",
      branchId: BRANCH_ID,
      isPrimary: true,
      status: "ACTIVE",
      updatedAt: new Date(),
      branch: { id: BRANCH_ID, code: "SANTOS", name: "Santos", status: "ACTIVE" },
    },
    {
      id: "link-2",
      branchId: BRANCH_ID_2,
      isPrimary: false,
      status: "ACTIVE",
      updatedAt: new Date(),
      branch: { id: BRANCH_ID_2, code: "MATRIZ", name: "Matriz", status: "ACTIVE" },
    },
  ],
};

function existingDriver(
  overrides: Partial<{
    id: string;
    tenantId: string;
    code: string;
    fullName: string;
    driverType: "INTERNAL" | "THIRD_PARTY";
    employmentType: "EMPLOYEE" | "CONTRACTOR";
    status: "ACTIVE" | "DISABLED";
    documentNumber: string | null;
    licenseNumber: string | null;
    licenseCategory: "E" | "D" | null;
    licenseExpiresAt: Date | null;
    moppCertified: boolean;
    moppExpiresAt: Date | null;
    admissionDate: Date | null;
    terminationDate: Date | null;
  }> = {},
) {
  return {
    id: DRIVER_ID,
    tenantId: TENANT_ID,
    code: "MOT001",
    fullName: "João Silva",
    driverType: "INTERNAL" as const,
    employmentType: "EMPLOYEE" as const,
    status: "ACTIVE" as const,
    documentNumber: "12345678901",
    licenseNumber: "12345678900",
    licenseCategory: "E" as const,
    licenseExpiresAt: new Date("2030-01-01"),
    moppCertified: false,
    moppExpiresAt: null,
    admissionDate: new Date("2022-01-01"),
    terminationDate: null,
    ...overrides,
  };
}

function makePrismaMock() {
  const driver = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const driverBranch = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
  };
  const branch = { findMany: jest.fn() };
  const userBranchAccess = { findMany: jest.fn() };

  const client = {
    driver,
    driverBranch,
    branch,
    userBranchAccess,
    $transaction: jest.fn(
      (cb: (tx: { driver: typeof driver; driverBranch: typeof driverBranch }) => unknown) =>
        cb({ driver, driverBranch }),
    ),
  };

  return { client };
}

const baseCreateDto = {
  code: "MOT001",
  fullName: "João Silva",
  driverType: "INTERNAL" as const,
  employmentType: "EMPLOYEE" as const,
  licenseNumber: "12345678900",
  licenseCategory: "E" as const,
  licenseExpiresAt: "2030-01-01",
  branchIds: [BRANCH_ID],
};

describe("DriversService", () => {
  let service: DriversService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = makePrismaMock();
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        AuthorizationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(DriversService);
    jest.clearAllMocks();
  });

  describe("listagem ABAC", () => {
    it("lista motoristas do tenant com escopo global", async () => {
      prisma.client.driver.findMany.mockResolvedValue([DRIVER_ROW]);
      prisma.client.driver.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_GLOBAL, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].branches).toHaveLength(2);
    });

    it("restringe listagem a motoristas com filial acessível", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      prisma.client.driver.findMany.mockResolvedValue([DRIVER_ROW]);
      prisma.client.driver.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_SCOPED_READ, {});

      expect(result.items[0].branches).toHaveLength(1);
      expect(result.items[0].branches[0].branchId).toBe(BRANCH_ID);
    });
  });

  describe("create", () => {
    beforeEach(() => {
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID }]);
    });

    it("exige branchIds", async () => {
      await expect(
        service.create(TENANT_ID, { ...baseCreateDto, branchIds: [] }, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("bloqueia create sem escopo global", async () => {
      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_SCOPED, {}),
      ).rejects.toThrow("Escopo global de motoristas necessário");
    });

    it("exige CNH completa para status ACTIVE", async () => {
      await expect(
        service.create(
          TENANT_ID,
          {
            ...baseCreateDto,
            licenseNumber: undefined,
            licenseCategory: undefined,
            licenseExpiresAt: undefined,
          },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("exige categoria e validade quando CNH informada", async () => {
      await expect(
        service.create(
          TENANT_ID,
          {
            ...baseCreateDto,
            licenseCategory: undefined,
            licenseExpiresAt: undefined,
          },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("exige validade MOPP quando certificado", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, moppCertified: true },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("bloqueia desligamento anterior à admissão", async () => {
      await expect(
        service.create(
          TENANT_ID,
          {
            ...baseCreateDto,
            admissionDate: "2024-06-01",
            terminationDate: "2024-01-01",
          },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("cria motorista e audita", async () => {
      prisma.client.driver.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingDriver())
        .mockResolvedValueOnce({ ...DRIVER_ROW, branches: [] });
      prisma.client.driver.create.mockResolvedValue(DRIVER_ROW);
      prisma.client.driverBranch.create.mockResolvedValue({});

      await service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DRIVER_CREATED,
          metadata: expect.not.objectContaining({
            documentNumber: expect.anything(),
            licenseNumber: expect.anything(),
          }),
        }),
      );
    });

    it("bloqueia código duplicado permanentemente", async () => {
      prisma.client.driver.findFirst.mockResolvedValue({ id: "other" });

      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("bloqueia documento duplicado entre ativos", async () => {
      prisma.client.driver.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "other" });

      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, documentNumber: "12345678901" },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("bloqueia CNH duplicada entre ativos", async () => {
      prisma.client.driver.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "other" });

      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("getById", () => {
    it("bloqueia motorista sem filial acessível", async () => {
      prisma.client.driver.findFirst.mockResolvedValue(existingDriver());
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: "other" }]);
      prisma.client.driverBranch.findFirst.mockResolvedValue(null);

      await expect(
        service.getById(DRIVER_ID, TENANT_ID, ACTOR_SCOPED_READ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("mutação global", () => {
    it("usuário limitado não altera dados globais", async () => {
      await expect(
        service.update(DRIVER_ID, TENANT_ID, { fullName: "Novo" }, ACTOR_SCOPED, {}),
      ).rejects.toThrow("Escopo global de motoristas necessário");
    });

    it("admin global altera e audita", async () => {
      prisma.client.driver.findFirst
        .mockResolvedValueOnce(existingDriver())
        .mockResolvedValueOnce(existingDriver())
        .mockResolvedValueOnce({ ...DRIVER_ROW, branches: [] });
      prisma.client.driver.update.mockResolvedValue(DRIVER_ROW);

      await service.update(DRIVER_ID, TENANT_ID, { fullName: "Atualizado" }, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DRIVER_UPDATED }),
      );
    });

    it("valida regras de CNH no update", async () => {
      prisma.client.driver.findFirst.mockResolvedValue(
        existingDriver({ licenseNumber: null, licenseCategory: null, licenseExpiresAt: null }),
      );

      await expect(
        service.update(DRIVER_ID, TENANT_ID, { status: "ACTIVE" }, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("DriverBranch", () => {
    it("usuário limitado não gerencia DriverBranch", async () => {
      await expect(
        service.assignBranches(
          DRIVER_ID,
          TENANT_ID,
          { branchIds: [BRANCH_ID_2] },
          ACTOR_SCOPED_ASSIGN,
          {},
        ),
      ).rejects.toThrow("Escopo global de motoristas necessário");
    });

    it("bloqueia remover última filial ativa", async () => {
      prisma.client.driver.findFirst.mockResolvedValue(existingDriver());
      prisma.client.driverBranch.count.mockResolvedValue(1);

      await expect(
        service.removeBranch(DRIVER_ID, TENANT_ID, BRANCH_ID, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("enable", () => {
    it("exige CNH completa para reativar", async () => {
      prisma.client.driver.findFirst.mockResolvedValue(
        existingDriver({
          status: "DISABLED",
          licenseNumber: null,
          licenseCategory: null,
          licenseExpiresAt: null,
        }),
      );

      await expect(
        service.enable(DRIVER_ID, TENANT_ID, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
