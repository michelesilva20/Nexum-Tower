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
import { CustomersService } from "./customers.service";

const TENANT_ID = "tenant-1";
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
  permissions: ["customers.read", "customers.create", "customers.update"],
};

const ACTOR_SCOPED_ASSIGN: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["customers.read", "customers.assign_branches"],
};

const ACTOR_SCOPED_READ: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["customers.read"],
};

const CUSTOMER_ROW = {
  id: CUSTOMER_ID,
  tenantId: TENANT_ID,
  code: "VALE",
  legalName: "Vale Demo",
  tradeName: "Vale",
  customerType: "CONTRACTING_CUSTOMER" as const,
  documentType: "CNPJ" as const,
  documentNumber: "123",
  stateRegistration: null,
  municipalRegistration: null,
  mainContactName: null,
  mainContactRole: null,
  email: null,
  billingEmail: null,
  phone: null,
  whatsapp: null,
  website: null,
  billingAddressLine1: null,
  billingAddressLine2: null,
  billingDistrict: null,
  billingCity: "SP",
  billingState: "SP",
  billingCountry: "BR",
  billingZipCode: null,
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

function existingCustomer(
  overrides: Partial<{
    id: string;
    tenantId: string;
    code: string;
    legalName: string;
    status: "ACTIVE" | "INACTIVE" | "DISABLED";
    documentNumber: string | null;
    documentType: "CNPJ" | null;
  }> = {},
) {
  return {
    id: CUSTOMER_ID,
    tenantId: TENANT_ID,
    code: "VALE",
    legalName: "Vale Demo",
    status: "ACTIVE" as const,
    documentNumber: "123",
    documentType: "CNPJ" as const,
    ...overrides,
  };
}

function makePrismaMock() {
  const customer = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const customerBranch = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
  };
  const branch = { findMany: jest.fn() };
  const userBranchAccess = { findMany: jest.fn(), findFirst: jest.fn() };

  const client = {
    customer,
    customerBranch,
    branch,
    userBranchAccess,
    $transaction: jest.fn(
      (cb: (tx: {
        customer: typeof customer;
        customerBranch: typeof customerBranch;
      }) => unknown) => cb({ customer, customerBranch }),
    ),
  };

  return { client };
}

describe("CustomersService", () => {
  let service: CustomersService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = makePrismaMock();
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        AuthorizationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(CustomersService);
    jest.clearAllMocks();
  });

  describe("listagem ABAC", () => {
    it("lista clientes do tenant com escopo global", async () => {
      prisma.client.customer.findMany.mockResolvedValue([CUSTOMER_ROW]);
      prisma.client.customer.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_GLOBAL, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].branches).toHaveLength(2);
    });

    it("restringe listagem a clientes com filial acessível", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      prisma.client.customer.findMany.mockResolvedValue([CUSTOMER_ROW]);
      prisma.client.customer.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_SCOPED_READ, {});

      expect(result.items[0].branches).toHaveLength(1);
      expect(result.items[0].branches[0].branchId).toBe(BRANCH_ID);
    });

    it("retorna lista vazia sem filiais acessíveis", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([]);
      prisma.client.customer.findMany.mockResolvedValue([]);
      prisma.client.customer.count.mockResolvedValue(0);

      const result = await service.list(TENANT_ID, ACTOR_SCOPED_READ, {});

      expect(result.items).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("exige branchIds", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { code: "X", legalName: "X", customerType: "OTHER", branchIds: [] },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("bloqueia create sem escopo global", async () => {
      await expect(
        service.create(
          TENANT_ID,
          { code: "NEW", legalName: "Novo", customerType: "OTHER", branchIds: [BRANCH_ID] },
          ACTOR_SCOPED,
          {},
        ),
      ).rejects.toThrow("Escopo global de clientes necessário");
    });

    it("cria cliente com filiais e audita", async () => {
      prisma.client.customer.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingCustomer())
        .mockResolvedValueOnce({ ...CUSTOMER_ROW, branches: [] });
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID }]);
      prisma.client.customer.create.mockResolvedValue(CUSTOMER_ROW);
      prisma.client.customerBranch.create.mockResolvedValue({});

      await service.create(
        TENANT_ID,
        {
          code: "VALE",
          legalName: "Vale Demo",
          customerType: "CONTRACTING_CUSTOMER",
          branchIds: [BRANCH_ID],
        },
        ACTOR_GLOBAL,
        {},
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CUSTOMER_CREATED }),
      );
    });

    it("bloqueia código duplicado permanentemente", async () => {
      prisma.client.customer.findFirst.mockResolvedValue({ id: "other", deletedAt: new Date() });

      await expect(
        service.create(
          TENANT_ID,
          { code: "VALE", legalName: "Vale", customerType: "OTHER", branchIds: [BRANCH_ID] },
          ACTOR_GLOBAL,
          {},
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("getById", () => {
    it("bloqueia customer sem filial acessível", async () => {
      prisma.client.customer.findFirst.mockResolvedValue(existingCustomer());
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: "other-branch" }]);
      prisma.client.customerBranch.findFirst.mockResolvedValue(null);

      await expect(service.getById(CUSTOMER_ID, TENANT_ID, ACTOR_SCOPED_READ)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("filtra filiais visíveis para usuário limitado", async () => {
      prisma.client.customer.findFirst
        .mockResolvedValueOnce(existingCustomer())
        .mockResolvedValueOnce({ ...CUSTOMER_ROW });
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      prisma.client.customerBranch.findFirst.mockResolvedValue({ id: "link-1" });

      const result = await service.getById(CUSTOMER_ID, TENANT_ID, ACTOR_SCOPED_READ);

      expect(result.branches).toHaveLength(1);
      expect(result.branches[0].branchId).toBe(BRANCH_ID);
    });
  });

  describe("mutação global", () => {
    it("usuário limitado não altera dados globais", async () => {
      await expect(
        service.update(CUSTOMER_ID, TENANT_ID, { legalName: "Novo" }, ACTOR_SCOPED, {}),
      ).rejects.toThrow("Escopo global de clientes necessário");
    });

    it("usuário limitado não desativa Customer", async () => {
      await expect(service.disable(CUSTOMER_ID, TENANT_ID, ACTOR_SCOPED, {})).rejects.toThrow(
        "Escopo global de clientes necessário",
      );
    });

    it("usuário limitado não exclui Customer", async () => {
      await expect(service.remove(CUSTOMER_ID, TENANT_ID, ACTOR_SCOPED, {})).rejects.toThrow(
        "Escopo global de clientes necessário",
      );
    });

    it("admin global altera dados globais e audita", async () => {
      prisma.client.customer.findFirst
        .mockResolvedValueOnce(existingCustomer())
        .mockResolvedValueOnce(existingCustomer())
        .mockResolvedValueOnce({ ...CUSTOMER_ROW, branches: [] });
      prisma.client.customer.update.mockResolvedValue(CUSTOMER_ROW);

      await service.update(CUSTOMER_ID, TENANT_ID, { legalName: "Atualizado" }, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CUSTOMER_UPDATED }),
      );
    });
  });

  describe("CustomerBranch", () => {
    it("usuário limitado não gerencia CustomerBranch mesmo com assign_branches", async () => {
      await expect(
        service.assignBranches(
          CUSTOMER_ID,
          TENANT_ID,
          { branchIds: [BRANCH_ID_2] },
          ACTOR_SCOPED_ASSIGN,
          {},
        ),
      ).rejects.toThrow("Escopo global de clientes necessário");
    });

    it("bloqueia remover última filial ativa", async () => {
      prisma.client.customer.findFirst.mockResolvedValue(existingCustomer());
      prisma.client.customerBranch.count.mockResolvedValue(1);

      await expect(
        service.removeBranch(CUSTOMER_ID, TENANT_ID, BRANCH_ID, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("audita assign branch", async () => {
      prisma.client.customer.findFirst.mockResolvedValue(existingCustomer());
      prisma.client.branch.findMany.mockResolvedValue([{ id: BRANCH_ID_2 }]);
      prisma.client.customerBranch.upsert.mockResolvedValue({});
      prisma.client.customerBranch.findMany.mockResolvedValue([]);

      await service.assignBranches(
        CUSTOMER_ID,
        TENANT_ID,
        { branchIds: [BRANCH_ID_2] },
        ACTOR_GLOBAL,
        {},
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CUSTOMER_BRANCH_ASSIGNED }),
      );
    });
  });
});
