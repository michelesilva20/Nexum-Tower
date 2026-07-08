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
import type { RoutePointInputDto } from "./dto/route.dto";
import { RoutesService } from "./routes.service";

const TENANT_ID = "tenant-1";
const ROUTE_ID = "route-1";
const CUSTOMER_ID = "customer-1";
const BRANCH_ID = "branch-1";
const BRANCH_ID_2 = "branch-2";
const ORIGIN_LOCATION_ID = "loc-origin";
const DEST_LOCATION_ID = "loc-dest";
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
  permissions: ["routes.read", "routes.create", "routes.update"],
};

const ACTOR_SCOPED_ASSIGN: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["routes.read", "routes.assign_branches"],
};

const ACTOR_SCOPED_POINTS: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["routes.read", "routes.manage_points"],
};

const ACTOR_SCOPED_READ: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["routes.read"],
};

const VALID_POINTS: RoutePointInputDto[] = [
  {
    locationId: ORIGIN_LOCATION_ID,
    sequence: 1,
    pointType: "ORIGIN",
    operationRole: "LOAD",
  },
  {
    locationId: DEST_LOCATION_ID,
    sequence: 2,
    pointType: "DESTINATION",
    operationRole: "UNLOAD",
  },
];

const ROUTE_ROW = {
  id: ROUTE_ID,
  tenantId: TENANT_ID,
  code: "ROTA_SANTOS_SP",
  name: "Santos → São Paulo",
  description: "Rota demo",
  routeType: "STANDARD" as const,
  operationType: "DISTRIBUTION" as const,
  customerId: null,
  originLocationId: ORIGIN_LOCATION_ID,
  destinationLocationId: DEST_LOCATION_ID,
  plannedDistanceKm: 450,
  plannedDurationMinutes: 360,
  estimatedTollCost: 120,
  estimatedFuelCost: 800,
  estimatedTotalCost: 920,
  requiresMopp: false,
  requiresRefrigeration: false,
  requiresTracking: true,
  requiresEscort: false,
  riskLevel: "LOW" as const,
  status: "ACTIVE" as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  disabledAt: null,
  deletedAt: null,
  customer: null,
  originLocation: {
    id: ORIGIN_LOCATION_ID,
    code: "PORTO_SANTOS",
    name: "Porto de Santos",
    city: "Santos",
    state: "SP",
  },
  destinationLocation: {
    id: DEST_LOCATION_ID,
    code: "CD_SP",
    name: "CD São Paulo",
    city: "São Paulo",
    state: "SP",
  },
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
  points: [],
  _count: { points: 2 },
  pointCount: 2,
};

function existingRoute(
  overrides: Partial<{
    id: string;
    tenantId: string;
    code: string;
    name: string;
    routeType: "STANDARD";
    operationType: "DISTRIBUTION";
    customerId: string | null;
    originLocationId: string | null;
    destinationLocationId: string | null;
    status: "ACTIVE" | "DISABLED";
  }> = {},
) {
  return {
    id: ROUTE_ID,
    tenantId: TENANT_ID,
    code: "ROTA_SANTOS_SP",
    name: "Santos → São Paulo",
    routeType: "STANDARD" as const,
    operationType: "DISTRIBUTION" as const,
    customerId: null,
    originLocationId: ORIGIN_LOCATION_ID,
    destinationLocationId: DEST_LOCATION_ID,
    status: "ACTIVE" as const,
    ...overrides,
  };
}

function makePrismaMock() {
  const route = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const routeBranch = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
  };
  const routePoint = {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  };
  const branch = { findMany: jest.fn() };
  const customer = { findFirst: jest.fn() };
  const customerBranch = { findMany: jest.fn() };
  const location = { findMany: jest.fn() };
  const locationBranch = { findMany: jest.fn() };
  const userBranchAccess = { findMany: jest.fn() };

  const client = {
    route,
    routeBranch,
    routePoint,
    branch,
    customer,
    customerBranch,
    location,
    locationBranch,
    userBranchAccess,
    $transaction: jest.fn(
      (cb: (tx: {
        route: typeof route;
        routeBranch: typeof routeBranch;
        routePoint: typeof routePoint;
      }) => unknown) => cb({ route, routeBranch, routePoint }),
    ),
  };

  return { client };
}

const baseCreateDto = {
  code: "ROTA_SANTOS_SP",
  name: "Santos → São Paulo",
  routeType: "STANDARD" as const,
  operationType: "DISTRIBUTION" as const,
  branchIds: [BRANCH_ID],
  points: VALID_POINTS,
};

function mockLocationBranchCompatibility() {
  prisma.client.location.findMany.mockResolvedValue([
    { id: ORIGIN_LOCATION_ID },
    { id: DEST_LOCATION_ID },
  ]);
  prisma.client.locationBranch.findMany.mockResolvedValue([
    { locationId: ORIGIN_LOCATION_ID, branchId: BRANCH_ID },
    { locationId: DEST_LOCATION_ID, branchId: BRANCH_ID },
  ]);
}

let prisma: ReturnType<typeof makePrismaMock>;

describe("RoutesService", () => {
  let service: RoutesService;
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = makePrismaMock();
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        AuthorizationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(RoutesService);
    jest.clearAllMocks();
  });

  describe("listagem ABAC", () => {
    it("lista rotas do tenant com escopo global", async () => {
      prisma.client.route.findMany.mockResolvedValue([ROUTE_ROW]);
      prisma.client.route.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_GLOBAL, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].pointCount).toBe(2);
      expect(result.items[0].branches).toHaveLength(2);
    });

    it("restringe listagem a rotas com filial acessível", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      prisma.client.route.findMany.mockResolvedValue([ROUTE_ROW]);
      prisma.client.route.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_SCOPED_READ, {});

      expect(result.items[0].branches).toHaveLength(1);
      expect(result.items[0].branches[0].branchId).toBe(BRANCH_ID);
    });

    it("aplica filtro branchId na listagem", async () => {
      prisma.client.route.findMany.mockResolvedValue([ROUTE_ROW]);
      prisma.client.route.count.mockResolvedValue(1);

      await service.list(TENANT_ID, ACTOR_GLOBAL, { branchId: BRANCH_ID });

      expect(prisma.client.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branches: expect.objectContaining({
              some: expect.objectContaining({ branchId: BRANCH_ID }),
            }),
          }),
        }),
      );
    });
  });

  describe("validatePoints", () => {
    it("exige ao menos 2 pontos", () => {
      expect(() => service.validatePoints([VALID_POINTS[0]])).toThrow(
        "ao menos 2 pontos",
      );
    });

    it("exige primeiro ponto ORIGIN", () => {
      expect(() =>
        service.validatePoints([
          { ...VALID_POINTS[0], pointType: "STOP" },
          VALID_POINTS[1],
        ]),
      ).toThrow("primeiro ponto deve ser do tipo ORIGIN");
    });

    it("exige último ponto DESTINATION", () => {
      expect(() =>
        service.validatePoints([
          VALID_POINTS[0],
          { ...VALID_POINTS[1], pointType: "STOP" },
        ]),
      ).toThrow("último ponto deve ser do tipo DESTINATION");
    });

    it("exige sequência única consecutiva iniciando em 1", () => {
      expect(() =>
        service.validatePoints([
          VALID_POINTS[0],
          { ...VALID_POINTS[1], sequence: 3 },
        ]),
      ).toThrow("consecutiva");
    });

    it("rejeita distância negativa no ponto", () => {
      expect(() =>
        service.validatePoints([
          VALID_POINTS[0],
          { ...VALID_POINTS[1], distanceFromPreviousKm: -10 },
        ]),
      ).toThrow("Distância desde o ponto anterior");
    });
  });

  describe("extractOriginDestination", () => {
    it("sincroniza origem e destino a partir dos pontos", () => {
      const result = service.extractOriginDestination(VALID_POINTS);
      expect(result.originLocationId).toBe(ORIGIN_LOCATION_ID);
      expect(result.destinationLocationId).toBe(DEST_LOCATION_ID);
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
      ).rejects.toThrow("Escopo global de rotas necessário");
    });

    it("valida compatibilidade CustomerBranch", async () => {
      prisma.client.route.findFirst.mockResolvedValue(null);
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID }]);
      prisma.client.customer.findFirst.mockResolvedValue({ id: CUSTOMER_ID, code: "VALE" });
      prisma.client.customerBranch.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, customerId: CUSTOMER_ID },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toThrow("filiais não atendem o cliente");
    });

    it("valida compatibilidade LocationBranch com filiais da rota", async () => {
      prisma.client.route.findFirst.mockResolvedValue(null);
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID }]);
      prisma.client.location.findMany.mockResolvedValue([
        { id: ORIGIN_LOCATION_ID },
        { id: DEST_LOCATION_ID },
      ]);
      prisma.client.locationBranch.findMany.mockResolvedValue([
        { locationId: ORIGIN_LOCATION_ID, branchId: BRANCH_ID_2 },
        { locationId: DEST_LOCATION_ID, branchId: BRANCH_ID_2 },
      ]);

      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {}),
      ).rejects.toThrow("filial em comum");
    });

    it("rejeita distância planejada negativa", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { ...baseCreateDto, plannedDistanceKm: -100 },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toThrow("Distância planejada");
    });

    it("cria rota com pontos e audita", async () => {
      prisma.client.route.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingRoute())
        .mockResolvedValueOnce({
          ...ROUTE_ROW,
          branches: [],
          points: VALID_POINTS,
        });
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID }]);
      mockLocationBranchCompatibility();
      prisma.client.route.create.mockResolvedValue(ROUTE_ROW);
      prisma.client.routeBranch.create.mockResolvedValue({});
      prisma.client.routePoint.create.mockResolvedValue({});

      await service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {});

      expect(prisma.client.routePoint.create).toHaveBeenCalledTimes(2);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ROUTE_CREATED,
          metadata: expect.objectContaining({
            pointCount: 2,
            originLocationId: ORIGIN_LOCATION_ID,
            destinationLocationId: DEST_LOCATION_ID,
          }),
        }),
      );
    });

    it("bloqueia código duplicado permanentemente", async () => {
      prisma.client.route.findFirst.mockResolvedValue({ id: "other" });

      await expect(
        service.create(TENANT_ID, baseCreateDto, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("getById", () => {
    it("bloqueia rota sem filial acessível", async () => {
      prisma.client.route.findFirst.mockResolvedValue(existingRoute());
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: "other" }]);
      prisma.client.routeBranch.findFirst.mockResolvedValue(null);

      await expect(
        service.getById(ROUTE_ID, TENANT_ID, ACTOR_SCOPED_READ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("retorna detalhe com pontos e pointCount", async () => {
      prisma.client.route.findFirst
        .mockResolvedValueOnce(existingRoute())
        .mockResolvedValueOnce({
          ...ROUTE_ROW,
          points: VALID_POINTS,
        });

      const result = await service.getById(ROUTE_ID, TENANT_ID, ACTOR_GLOBAL);

      expect(result.pointCount).toBe(2);
      expect(result.points).toHaveLength(2);
    });
  });

  describe("mutação global", () => {
    it("usuário limitado não altera dados globais", async () => {
      await expect(
        service.update(ROUTE_ID, TENANT_ID, { name: "Novo" }, ACTOR_SCOPED, {}),
      ).rejects.toThrow("Escopo global de rotas necessário");
    });

    it("admin global altera e audita", async () => {
      prisma.client.route.findFirst
        .mockResolvedValueOnce(existingRoute())
        .mockResolvedValueOnce(existingRoute())
        .mockResolvedValueOnce({ ...ROUTE_ROW, branches: [], points: [] });
      prisma.client.route.update.mockResolvedValue(ROUTE_ROW);

      await service.update(ROUTE_ID, TENANT_ID, { name: "Atualizado" }, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROUTE_UPDATED }),
      );
    });

    it("desabilita rota e audita", async () => {
      prisma.client.route.findFirst
        .mockResolvedValueOnce(existingRoute())
        .mockResolvedValueOnce(existingRoute())
        .mockResolvedValueOnce({ ...ROUTE_ROW, branches: [], points: [] });
      prisma.client.route.update.mockResolvedValue(ROUTE_ROW);

      await service.disable(ROUTE_ID, TENANT_ID, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROUTE_DISABLED }),
      );
    });

    it("habilita rota e audita", async () => {
      prisma.client.route.findFirst
        .mockResolvedValueOnce(existingRoute({ status: "DISABLED" }))
        .mockResolvedValueOnce(existingRoute({ status: "DISABLED" }))
        .mockResolvedValueOnce({ ...ROUTE_ROW, branches: [], points: [] });
      prisma.client.route.update.mockResolvedValue(ROUTE_ROW);

      await service.enable(ROUTE_ID, TENANT_ID, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROUTE_ENABLED }),
      );
    });

    it("remove rota com soft delete em branches e pontos", async () => {
      prisma.client.route.findFirst.mockResolvedValue(existingRoute());
      prisma.client.route.update.mockResolvedValue({});
      prisma.client.routeBranch.updateMany.mockResolvedValue({ count: 1 });
      prisma.client.routePoint.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.remove(ROUTE_ID, TENANT_ID, ACTOR_GLOBAL, {});

      expect(result).toEqual({ success: true });
      expect(prisma.client.routePoint.updateMany).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROUTE_DELETED }),
      );
    });
  });

  describe("RouteBranch", () => {
    it("usuário limitado não gerencia RouteBranch", async () => {
      await expect(
        service.assignBranches(
          ROUTE_ID,
          TENANT_ID,
          { branchIds: [BRANCH_ID_2] },
          ACTOR_SCOPED_ASSIGN,
          {},
        ),
      ).rejects.toThrow("Escopo global de rotas necessário");
    });

    it("valida CustomerBranch ao atribuir filiais", async () => {
      prisma.client.route.findFirst.mockResolvedValue(
        existingRoute({ customerId: CUSTOMER_ID }),
      );
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID_2 }]);
      prisma.client.customerBranch.findMany.mockResolvedValue([]);

      await expect(
        service.assignBranches(
          ROUTE_ID,
          TENANT_ID,
          { branchIds: [BRANCH_ID_2] },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toThrow("filiais não atendem o cliente");
    });

    it("bloqueia remover última filial ativa", async () => {
      prisma.client.route.findFirst.mockResolvedValue(existingRoute());
      prisma.client.routeBranch.count.mockResolvedValue(1);

      await expect(
        service.removeBranch(ROUTE_ID, TENANT_ID, BRANCH_ID, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("atribui filiais e audita", async () => {
      prisma.client.route.findFirst.mockResolvedValue(existingRoute());
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID_2 }]);
      prisma.client.routeBranch.upsert.mockResolvedValue({});
      prisma.client.routeBranch.findMany.mockResolvedValue([]);

      await service.assignBranches(
        ROUTE_ID,
        TENANT_ID,
        { branchIds: [BRANCH_ID_2] },
        ACTOR_GLOBAL,
        {},
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROUTE_BRANCH_ASSIGNED }),
      );
    });
  });

  describe("RoutePoint", () => {
    it("usuário limitado não substitui pontos", async () => {
      await expect(
        service.replacePoints(
          ROUTE_ID,
          TENANT_ID,
          { points: VALID_POINTS },
          ACTOR_SCOPED_POINTS,
          {},
        ),
      ).rejects.toThrow("Escopo global de rotas necessário");
    });

    it("substitui pontos transactionalmente e sincroniza origem/destino", async () => {
      prisma.client.route.findFirst.mockResolvedValue(existingRoute());
      prisma.client.routeBranch.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      mockLocationBranchCompatibility();
      prisma.client.routePoint.count.mockResolvedValue(2);
      prisma.client.routePoint.deleteMany.mockResolvedValue({ count: 2 });
      prisma.client.routePoint.create.mockResolvedValue({});
      prisma.client.route.update.mockResolvedValue({});
      prisma.client.routePoint.findMany.mockResolvedValue(VALID_POINTS);

      await service.replacePoints(
        ROUTE_ID,
        TENANT_ID,
        { points: VALID_POINTS },
        ACTOR_GLOBAL,
        {},
      );

      expect(prisma.client.routePoint.deleteMany).toHaveBeenCalled();
      expect(prisma.client.routePoint.create).toHaveBeenCalledTimes(2);
      expect(prisma.client.route.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            originLocationId: ORIGIN_LOCATION_ID,
            destinationLocationId: DEST_LOCATION_ID,
          },
        }),
      );
    });

    it("audita ROUTE_POINTS_UPDATED apenas com contagem, sem payload de pontos", async () => {
      prisma.client.route.findFirst.mockResolvedValue(existingRoute());
      prisma.client.routeBranch.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      mockLocationBranchCompatibility();
      prisma.client.routePoint.count.mockResolvedValue(3);
      prisma.client.routePoint.deleteMany.mockResolvedValue({ count: 3 });
      prisma.client.routePoint.create.mockResolvedValue({});
      prisma.client.route.update.mockResolvedValue({});
      prisma.client.routePoint.findMany.mockResolvedValue(VALID_POINTS);

      await service.replacePoints(
        ROUTE_ID,
        TENANT_ID,
        { points: VALID_POINTS },
        ACTOR_GLOBAL,
        {},
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ROUTE_POINTS_UPDATED,
          metadata: expect.objectContaining({
            previousPointCount: 3,
            newPointCount: 2,
            routeId: ROUTE_ID,
            routeCode: "ROTA_SANTOS_SP",
          }),
        }),
      );

      const auditPayload = audit.log.mock.calls.at(-1)?.[0];
      expect(auditPayload.metadata.points).toBeUndefined();
    });

    it("lista pontos da rota", async () => {
      prisma.client.route.findFirst.mockResolvedValue(existingRoute());
      prisma.client.routePoint.findMany.mockResolvedValue(VALID_POINTS);

      const points = await service.listPoints(ROUTE_ID, TENANT_ID, ACTOR_GLOBAL);

      expect(points).toHaveLength(2);
    });
  });
});
