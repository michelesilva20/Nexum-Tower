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
import { LocationsService } from "./locations.service";

const TENANT_ID = "tenant-1";
const LOCATION_ID = "location-1";
const CUSTOMER_ID = "customer-1";
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
  permissions: ["locations.read", "locations.create", "locations.update"],
};

const ACTOR_SCOPED_ASSIGN: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["locations.read", "locations.assign_branches"],
};

const ACTOR_SCOPED_READ: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["locations.read"],
};

const LOCATION_ROW = {
  id: LOCATION_ID,
  tenantId: TENANT_ID,
  code: "PORTO_SANTOS",
  name: "Porto de Santos Demo",
  locationType: "PORT" as const,
  customerId: null,
  addressLine1: "Av. Portuária s/n",
  addressLine2: null,
  district: null,
  city: "Santos",
  state: "SP",
  country: "BR",
  zipCode: null,
  latitude: -23.9675,
  longitude: -46.328,
  timezone: null,
  geofenceRadiusMeters: null,
  contactName: null,
  contactRole: null,
  email: null,
  phone: null,
  whatsapp: null,
  operatingHours: null,
  accessInstructions: null,
  dockInfo: null,
  referencePoint: null,
  status: "ACTIVE" as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  disabledAt: null,
  deletedAt: null,
  customer: null,
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

function existingLocation(
  overrides: Partial<{
    id: string;
    tenantId: string;
    code: string;
    name: string;
    locationType: "PORT" | "CUSTOMER_SITE";
    customerId: string | null;
    status: "ACTIVE" | "DISABLED";
    latitude: number | null;
    longitude: number | null;
    geofenceRadiusMeters: number | null;
  }> = {},
) {
  return {
    id: LOCATION_ID,
    tenantId: TENANT_ID,
    code: "PORTO_SANTOS",
    name: "Porto de Santos Demo",
    locationType: "PORT" as const,
    customerId: null,
    status: "ACTIVE" as const,
    latitude: -23.9675,
    longitude: -46.328,
    geofenceRadiusMeters: null,
    ...overrides,
  };
}

function makePrismaMock() {
  const location = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const locationBranch = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
  };
  const branch = { findMany: jest.fn() };
  const customer = { findFirst: jest.fn() };
  const customerBranch = { findMany: jest.fn() };
  const userBranchAccess = { findMany: jest.fn() };

  const client = {
    location,
    locationBranch,
    branch,
    customer,
    customerBranch,
    userBranchAccess,
    $transaction: jest.fn(
      (cb: (tx: {
        location: typeof location;
        locationBranch: typeof locationBranch;
      }) => unknown) => cb({ location, locationBranch }),
    ),
  };

  return { client };
}

const baseCreateDto = {
  code: "PORTO_SANTOS",
  name: "Porto Demo",
  locationType: "PORT" as const,
  addressLine1: "Av. Portuária",
  city: "Santos",
  state: "SP",
  branchIds: [BRANCH_ID],
};

describe("LocationsService", () => {
  let service: LocationsService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = makePrismaMock();
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        AuthorizationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(LocationsService);
    jest.clearAllMocks();
  });

  describe("listagem ABAC", () => {
    it("lista locais do tenant com escopo global", async () => {
      prisma.client.location.findMany.mockResolvedValue([LOCATION_ROW]);
      prisma.client.location.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_GLOBAL, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].branches).toHaveLength(2);
    });

    it("restringe listagem a locais com filial acessível", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      prisma.client.location.findMany.mockResolvedValue([LOCATION_ROW]);
      prisma.client.location.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_SCOPED_READ, {});

      expect(result.items[0].branches).toHaveLength(1);
      expect(result.items[0].branches[0].branchId).toBe(BRANCH_ID);
    });
  });

  describe("create", () => {
    it("exige branchIds", async () => {
      await expect(
        service.create(TENANT_ID, { ...baseCreateDto, branchIds: [] }, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("bloqueia create sem escopo global", async () => {
      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_SCOPED, {}),
      ).rejects.toThrow("Escopo global de locais necessário");
    });

    it("exige customerId para CUSTOMER_SITE", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, locationType: "CUSTOMER_SITE" },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("bloqueia latitude sem longitude", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, latitude: -23.9 },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("valida compatibilidade CustomerBranch", async () => {
      prisma.client.location.findFirst.mockResolvedValue(null);
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID }]);
      prisma.client.customer.findFirst.mockResolvedValue({ id: CUSTOMER_ID, code: "VALE" });
      prisma.client.customerBranch.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          TENANT_ID,
          {
            ...baseCreateDto,
            locationType: "CUSTOMER_SITE",
            customerId: CUSTOMER_ID,
          },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toThrow("filiais não atendem o cliente");
    });

    it("cria local e audita", async () => {
      prisma.client.location.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingLocation())
        .mockResolvedValueOnce({ ...LOCATION_ROW, branches: [] });
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID }]);
      prisma.client.location.create.mockResolvedValue(LOCATION_ROW);
      prisma.client.locationBranch.create.mockResolvedValue({});

      await service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.LOCATION_CREATED }),
      );
    });

    it("bloqueia código duplicado permanentemente", async () => {
      prisma.client.location.findFirst.mockResolvedValue({ id: "other" });

      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("getById", () => {
    it("bloqueia local sem filial acessível", async () => {
      prisma.client.location.findFirst.mockResolvedValue(existingLocation());
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: "other" }]);
      prisma.client.locationBranch.findFirst.mockResolvedValue(null);

      await expect(
        service.getById(LOCATION_ID, TENANT_ID, ACTOR_SCOPED_READ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("mutação global", () => {
    it("usuário limitado não altera dados globais", async () => {
      await expect(
        service.update(LOCATION_ID, TENANT_ID, { name: "Novo" }, ACTOR_SCOPED, {}),
      ).rejects.toThrow("Escopo global de locais necessário");
    });

    it("admin global altera e audita", async () => {
      prisma.client.location.findFirst
        .mockResolvedValueOnce(existingLocation())
        .mockResolvedValueOnce(existingLocation())
        .mockResolvedValueOnce({ ...LOCATION_ROW, branches: [] });
      prisma.client.location.update.mockResolvedValue(LOCATION_ROW);

      await service.update(LOCATION_ID, TENANT_ID, { name: "Atualizado" }, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.LOCATION_UPDATED }),
      );
    });
  });

  describe("LocationBranch", () => {
    it("usuário limitado não gerencia LocationBranch", async () => {
      await expect(
        service.assignBranches(
          LOCATION_ID,
          TENANT_ID,
          { branchIds: [BRANCH_ID_2] },
          ACTOR_SCOPED_ASSIGN,
          {},
        ),
      ).rejects.toThrow("Escopo global de locais necessário");
    });

    it("bloqueia remover última filial ativa", async () => {
      prisma.client.location.findFirst.mockResolvedValue(existingLocation());
      prisma.client.locationBranch.count.mockResolvedValue(1);

      await expect(
        service.removeBranch(LOCATION_ID, TENANT_ID, BRANCH_ID, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
