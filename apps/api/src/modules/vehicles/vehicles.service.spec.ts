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
import { VehiclesService } from "./vehicles.service";

const TENANT_ID = "tenant-1";
const VEHICLE_ID = "vehicle-1";
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
  permissions: ["vehicles.read", "vehicles.create", "vehicles.update"],
};

const ACTOR_SCOPED_ASSIGN: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["vehicles.read", "vehicles.assign_branches"],
};

const ACTOR_SCOPED_READ: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["vehicles.read"],
};

const VEHICLE_ROW = {
  id: VEHICLE_ID,
  tenantId: TENANT_ID,
  code: "VEI001",
  plate: "ABC1D23",
  fleetNumber: "FROTA-001",
  vehicleType: "TRUCK" as const,
  vehicleCategory: "CARGO" as const,
  ownershipType: "OWNED" as const,
  brand: "Volkswagen",
  model: "29.520",
  version: "Constellation",
  manufactureYear: 2022,
  modelYear: 2023,
  color: "Branco",
  renavam: "12345678901",
  chassisNumber: "9BWZZZ377VT004251",
  engineNumber: "ENG123456",
  licensePlateState: "SP",
  licensePlateCountry: "BR",
  fuelType: "DIESEL" as const,
  emissionStandard: "EURO5",
  axleCount: 3,
  tireCount: 10,
  tareWeightKg: 8500,
  grossWeightKg: 23000,
  payloadCapacityKg: 14500,
  volumeCapacityM3: 30,
  bodyType: "DRY_VAN" as const,
  bodyDescription: "Baú seco",
  trackerProvider: "Sascar",
  trackerDeviceId: "TRK-001",
  trackerImei: "867530912345678",
  odometerKm: 125000,
  hourMeter: null,
  licensingExpiresAt: new Date("2027-08-15"),
  insuranceExpiresAt: new Date("2026-12-01"),
  inspectionExpiresAt: null,
  tachographExpiresAt: new Date("2027-02-28"),
  anttExpiresAt: new Date("2028-01-10"),
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

function existingVehicle(
  overrides: Partial<{
    id: string;
    tenantId: string;
    code: string;
    plate: string;
    fleetNumber: string | null;
    vehicleType: "TRUCK" | "TRACTOR_TRUCK";
    vehicleCategory: "CARGO";
    status: "ACTIVE" | "DISABLED";
    renavam: string | null;
    chassisNumber: string | null;
    axleCount: number | null;
    tireCount: number | null;
    tareWeightKg: number | null;
    grossWeightKg: number | null;
    payloadCapacityKg: number | null;
    volumeCapacityM3: number | null;
    odometerKm: number | null;
    hourMeter: number | null;
  }> = {},
) {
  return {
    id: VEHICLE_ID,
    tenantId: TENANT_ID,
    code: "VEI001",
    plate: "ABC1D23",
    fleetNumber: "FROTA-001",
    vehicleType: "TRUCK" as const,
    vehicleCategory: "CARGO" as const,
    status: "ACTIVE" as const,
    renavam: "12345678901",
    chassisNumber: "9BWZZZ377VT004251",
    axleCount: 3,
    tireCount: 10,
    tareWeightKg: 8500,
    grossWeightKg: 23000,
    payloadCapacityKg: 14500,
    volumeCapacityM3: 30,
    odometerKm: 125000,
    hourMeter: null,
    ...overrides,
  };
}

function makePrismaMock() {
  const vehicle = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const vehicleBranch = {
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
    vehicle,
    vehicleBranch,
    branch,
    userBranchAccess,
    $transaction: jest.fn(
      (cb: (tx: { vehicle: typeof vehicle; vehicleBranch: typeof vehicleBranch }) => unknown) =>
        cb({ vehicle, vehicleBranch }),
    ),
  };

  return { client };
}

const baseCreateDto = {
  code: "VEI001",
  plate: "ABC-1D23",
  vehicleType: "TRUCK" as const,
  vehicleCategory: "CARGO" as const,
  ownershipType: "OWNED" as const,
  brand: "Volkswagen",
  model: "29.520",
  branchIds: [BRANCH_ID],
};

describe("VehiclesService", () => {
  let service: VehiclesService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = makePrismaMock();
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        AuthorizationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(VehiclesService);
    jest.clearAllMocks();
  });

  describe("listagem ABAC", () => {
    it("lista veículos do tenant com escopo global", async () => {
      prisma.client.vehicle.findMany.mockResolvedValue([VEHICLE_ROW]);
      prisma.client.vehicle.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_GLOBAL, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].branches).toHaveLength(2);
    });

    it("restringe listagem a veículos com filial acessível", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      prisma.client.vehicle.findMany.mockResolvedValue([VEHICLE_ROW]);
      prisma.client.vehicle.count.mockResolvedValue(1);

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
      ).rejects.toThrow("Escopo global de veículos necessário");
    });

    it("normaliza placa removendo hífens e espaços", async () => {
      prisma.client.vehicle.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingVehicle())
        .mockResolvedValueOnce({ ...VEHICLE_ROW, branches: [] });
      prisma.client.vehicle.create.mockResolvedValue(VEHICLE_ROW);
      prisma.client.vehicleBranch.create.mockResolvedValue({});

      await service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {});

      expect(prisma.client.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ plate: "ABC1D23" }),
        }),
      );
    });

    it("rejeita axleCount não positivo", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, axleCount: 0 },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejeita peso tara não positivo", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, tareWeightKg: -100 },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("cria veículo e audita sem dados sensíveis", async () => {
      prisma.client.vehicle.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingVehicle())
        .mockResolvedValueOnce({ ...VEHICLE_ROW, branches: [] });
      prisma.client.vehicle.create.mockResolvedValue(VEHICLE_ROW);
      prisma.client.vehicleBranch.create.mockResolvedValue({});

      await service.create(
        TENANT_ID,
        {
          ...baseCreateDto,
          renavam: "12345678901",
          chassisNumber: "9BWZZZ377VT004251",
          trackerDeviceId: "TRK-001",
          trackerImei: "867530912345678",
        },
        ACTOR_GLOBAL,
        {},
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.VEHICLE_CREATED,
          metadata: expect.not.objectContaining({
            renavam: expect.anything(),
            chassisNumber: expect.anything(),
            engineNumber: expect.anything(),
            trackerDeviceId: expect.anything(),
            trackerImei: expect.anything(),
          }),
        }),
      );
    });

    it("bloqueia código duplicado permanentemente", async () => {
      prisma.client.vehicle.findFirst.mockResolvedValue({ id: "other" });

      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("bloqueia placa duplicada entre ativos", async () => {
      prisma.client.vehicle.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "other" });

      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("bloqueia RENAVAM duplicado entre ativos", async () => {
      prisma.client.vehicle.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "other" });

      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, renavam: "12345678901" },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("bloqueia fleetNumber duplicado entre ativos", async () => {
      prisma.client.vehicle.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "other" });

      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, fleetNumber: "FROTA-001" },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("getById", () => {
    it("bloqueia veículo sem filial acessível", async () => {
      prisma.client.vehicle.findFirst.mockResolvedValue(existingVehicle());
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: "other" }]);
      prisma.client.vehicleBranch.findFirst.mockResolvedValue(null);

      await expect(
        service.getById(VEHICLE_ID, TENANT_ID, ACTOR_SCOPED_READ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("mutação global", () => {
    it("usuário limitado não altera dados globais", async () => {
      await expect(
        service.update(VEHICLE_ID, TENANT_ID, { brand: "Scania" }, ACTOR_SCOPED, {}),
      ).rejects.toThrow("Escopo global de veículos necessário");
    });

    it("admin global altera e audita", async () => {
      prisma.client.vehicle.findFirst
        .mockResolvedValueOnce(existingVehicle())
        .mockResolvedValueOnce(existingVehicle())
        .mockResolvedValueOnce({ ...VEHICLE_ROW, branches: [] });
      prisma.client.vehicle.update.mockResolvedValue(VEHICLE_ROW);

      await service.update(VEHICLE_ID, TENANT_ID, { brand: "Scania" }, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.VEHICLE_UPDATED }),
      );
    });

    it("valida números positivos no update", async () => {
      prisma.client.vehicle.findFirst.mockResolvedValue(existingVehicle());

      await expect(
        service.update(VEHICLE_ID, TENANT_ID, { odometerKm: -1 }, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("VehicleBranch", () => {
    it("usuário limitado não gerencia VehicleBranch", async () => {
      await expect(
        service.assignBranches(
          VEHICLE_ID,
          TENANT_ID,
          { branchIds: [BRANCH_ID_2] },
          ACTOR_SCOPED_ASSIGN,
          {},
        ),
      ).rejects.toThrow("Escopo global de veículos necessário");
    });

    it("bloqueia remover última filial ativa", async () => {
      prisma.client.vehicle.findFirst.mockResolvedValue(existingVehicle());
      prisma.client.vehicleBranch.count.mockResolvedValue(1);

      await expect(
        service.removeBranch(VEHICLE_ID, TENANT_ID, BRANCH_ID, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("enable", () => {
    it("rejeita reativação com odômetro inválido", async () => {
      prisma.client.vehicle.findFirst.mockResolvedValue(
        existingVehicle({ status: "DISABLED", odometerKm: -10 }),
      );

      await expect(
        service.enable(VEHICLE_ID, TENANT_ID, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
