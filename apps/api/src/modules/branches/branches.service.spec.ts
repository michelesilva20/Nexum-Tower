import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuditAction } from "../../common/audit-actions";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthorizationService } from "../authorization/authorization.service";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { BranchesService } from "./branches.service";

const TENANT_ID = "tenant-1";
const OTHER_TENANT = "tenant-2";
const BRANCH_ID = "branch-1";
const USER_ID = "user-1";

const ACTOR_GLOBAL: AuthUserPayload = {
  userId: USER_ID,
  tenantId: TENANT_ID,
  sessionId: "s1",
  email: "admin@test.local",
  permissions: ["*"],
};

const ACTOR_TENANT_ADMIN: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["branches.manage", "branches.read", "branches.create", "branches.update"],
};

const ACTOR_SCOPED: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["branches.read", "branches.assign_users"],
};

const ACTOR_SCOPED_READ: AuthUserPayload = {
  ...ACTOR_GLOBAL,
  permissions: ["branches.read"],
};

const BRANCH_ROW = {
  id: BRANCH_ID,
  tenantId: TENANT_ID,
  code: "MATRIZ",
  name: "Matriz",
  legalName: null,
  documentType: null,
  documentNumber: null,
  email: null,
  phone: null,
  addressLine1: null,
  addressLine2: null,
  city: "São Paulo",
  state: "SP",
  country: "BR",
  zipCode: null,
  status: "ACTIVE" as const,
  isHeadquarters: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  disabledAt: null,
  deletedAt: null,
};

function existingBranch(
  overrides: {
    id?: string;
    tenantId?: string;
    code?: string;
    name?: string;
    status?: "ACTIVE" | "INACTIVE" | "DISABLED";
    documentNumber?: string | null;
  } = {},
) {
  return {
    id: BRANCH_ID,
    tenantId: TENANT_ID,
    code: "MATRIZ",
    name: "Matriz",
    status: "ACTIVE" as const,
    documentNumber: null,
    ...overrides,
  };
}

function makePrismaMock() {
  const branch = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };
  const userBranchAccess = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  };
  const user = { findFirst: jest.fn() };

  const client = {
    branch,
    userBranchAccess,
    user,
    $transaction: jest.fn(
      (cb: (tx: { branch: typeof branch; userBranchAccess: typeof userBranchAccess; user: typeof user }) => unknown) =>
        cb({ branch, userBranchAccess, user }),
    ),
  };

  return { client };
}

describe("BranchesService", () => {
  let service: BranchesService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = makePrismaMock();
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        AuthorizationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(BranchesService);
    jest.clearAllMocks();
  });

  describe("listagem e escopo ABAC", () => {
    it("lista filiais do tenant com escopo global", async () => {
      prisma.client.branch.findMany.mockResolvedValue([BRANCH_ROW]);
      prisma.client.branch.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID, ACTOR_GLOBAL, {});

      expect(result.items).toHaveLength(1);
      expect(prisma.client.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID, deletedAt: null }),
        }),
      );
    });

    it("restringe listagem a filiais vinculadas sem escopo global", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([{ branchId: BRANCH_ID }]);
      prisma.client.branch.findMany.mockResolvedValue([BRANCH_ROW]);
      prisma.client.branch.count.mockResolvedValue(1);

      await service.list(TENANT_ID, ACTOR_SCOPED_READ, {});

      expect(prisma.client.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: [BRANCH_ID] } }),
        }),
      );
    });

    it("retorna lista vazia quando usuário não tem vínculos", async () => {
      prisma.client.userBranchAccess.findMany.mockResolvedValue([]);
      prisma.client.branch.findMany.mockResolvedValue([]);
      prisma.client.branch.count.mockResolvedValue(0);

      const result = await service.list(TENANT_ID, ACTOR_SCOPED_READ, {});

      expect(result.items).toHaveLength(0);
      expect(prisma.client.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: [] } }),
        }),
      );
    });
  });

  describe("getById", () => {
    it("exige acesso à filial para usuário com escopo limitado", async () => {
      prisma.client.branch.findFirst.mockResolvedValueOnce(existingBranch()).mockResolvedValueOnce(BRANCH_ROW);
      prisma.client.userBranchAccess.findFirst.mockResolvedValue(null);

      await expect(service.getById(BRANCH_ID, TENANT_ID, ACTOR_SCOPED_READ)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("retorna 404 para filial inexistente no tenant", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(null);

      await expect(service.getById("missing", TENANT_ID, ACTOR_GLOBAL)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("bloqueia tenant cruzado", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(existingBranch({ tenantId: OTHER_TENANT }));

      await expect(service.getById(BRANCH_ID, TENANT_ID, ACTOR_GLOBAL)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("administração de filial (escopo global)", () => {
    it("cria filial e audita", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(null);
      prisma.client.branch.create.mockResolvedValue(BRANCH_ROW);

      await service.create(TENANT_ID, { code: "MATRIZ", name: "Matriz" }, ACTOR_GLOBAL, { ipAddress: "127.0.0.1" });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BRANCH_CREATED, tenantId: TENANT_ID }),
      );
    });

    it("bloqueia create sem escopo global", async () => {
      await expect(
        service.create(TENANT_ID, { code: "X", name: "X" }, ACTOR_SCOPED_READ, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("bloqueia código duplicado no mesmo tenant (inclui soft-deleted)", async () => {
      prisma.client.branch.findFirst.mockResolvedValue({ id: "other", deletedAt: new Date() });

      await expect(
        service.create(TENANT_ID, { code: "SANTOS", name: "Santos" }, ACTOR_GLOBAL, {}),
      ).rejects.toThrow("Não é possível reutilizar este código de filial");
    });

    it("permite mesmo code em tenants diferentes", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(null);
      prisma.client.branch.create.mockResolvedValue({ ...BRANCH_ROW, code: "SANTOS" });

      await expect(
        service.create(TENANT_ID, { code: "SANTOS", name: "Santos" }, ACTOR_GLOBAL, {}),
      ).resolves.toBeDefined();

      expect(prisma.client.branch.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID, code: "SANTOS" }),
        }),
      );
    });

    it("bloqueia update para code já usado no tenant", async () => {
      prisma.client.branch.findFirst
        .mockResolvedValueOnce(existingBranch())
        .mockResolvedValueOnce({ id: "other", deletedAt: new Date() });

      await expect(
        service.update(BRANCH_ID, TENANT_ID, { code: "SANTOS" }, ACTOR_GLOBAL, {}),
      ).rejects.toThrow("Não é possível reutilizar este código de filial");
    });

    it("soft delete não libera code para reutilização", async () => {
      prisma.client.branch.findFirst.mockResolvedValue({ id: BRANCH_ID, deletedAt: new Date() });

      await expect(
        service.create(TENANT_ID, { code: "MATRIZ", name: "Nova Matriz" }, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("bloqueia update sem escopo global", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(existingBranch());

      await expect(
        service.update(BRANCH_ID, TENANT_ID, { name: "Novo" }, ACTOR_SCOPED, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("audita disable com metadata de status", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(existingBranch());
      prisma.client.branch.update.mockResolvedValue(BRANCH_ROW);

      await service.disable(BRANCH_ID, TENANT_ID, ACTOR_TENANT_ADMIN, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.BRANCH_DISABLED,
          metadata: expect.objectContaining({ previousStatus: "ACTIVE", newStatus: "DISABLED" }),
        }),
      );
    });

    it("audita enable", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(
        existingBranch({ status: "DISABLED" as const }),
      );
      prisma.client.branch.update.mockResolvedValue(BRANCH_ROW);

      await service.enable(BRANCH_ID, TENANT_ID, ACTOR_TENANT_ADMIN, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BRANCH_ENABLED }),
      );
    });

    it("soft delete limpa isHeadquarters e audita", async () => {
      prisma.client.branch.findFirst.mockResolvedValue(existingBranch());
      prisma.client.branch.update.mockResolvedValue(BRANCH_ROW);

      await service.remove(BRANCH_ID, TENANT_ID, ACTOR_GLOBAL, {});

      expect(prisma.client.branch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isHeadquarters: false, deletedAt: expect.any(Date) }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BRANCH_DELETED }),
      );
    });
  });

  describe("UserBranchAccess", () => {
    it("assignUser valida usuário do mesmo tenant", async () => {
      prisma.client.branch.findFirst
        .mockResolvedValueOnce(existingBranch())
        .mockResolvedValueOnce(existingBranch())
        .mockResolvedValueOnce({ id: BRANCH_ID });
      prisma.client.user.findFirst.mockResolvedValue(null);

      await expect(
        service.assignUser(BRANCH_ID, TENANT_ID, { userId: "u2" }, ACTOR_GLOBAL, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("assignUser audita vínculo", async () => {
      prisma.client.branch.findFirst
        .mockResolvedValueOnce(existingBranch())
        .mockResolvedValueOnce({ id: BRANCH_ID });
      prisma.client.user.findFirst.mockResolvedValue({ id: "u2" });
      prisma.client.userBranchAccess.upsert.mockResolvedValue({
        id: "uba-1",
        scope: "MEMBER",
        user: { id: "u2", name: "U", email: "u@test", status: "ACTIVE" },
      });

      await service.assignUser(BRANCH_ID, TENANT_ID, { userId: "u2" }, ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.BRANCH_USER_ASSIGNED,
          metadata: expect.objectContaining({ targetUserId: "u2" }),
        }),
      );
    });

    it("removeUser audita remoção", async () => {
      prisma.client.branch.findFirst
        .mockResolvedValueOnce(existingBranch())
        .mockResolvedValueOnce({ id: BRANCH_ID });
      prisma.client.user.findFirst.mockResolvedValue({ id: "u2" });
      prisma.client.userBranchAccess.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeUser(BRANCH_ID, TENANT_ID, "u2", ACTOR_GLOBAL, {});

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.BRANCH_USER_REMOVED,
          metadata: expect.objectContaining({ targetUserId: "u2" }),
        }),
      );
    });

    it("removeUser retorna 404 quando vínculo não existe", async () => {
      prisma.client.branch.findFirst
        .mockResolvedValueOnce(existingBranch())
        .mockResolvedValueOnce({ id: BRANCH_ID });
      prisma.client.user.findFirst.mockResolvedValue({ id: "u2" });
      prisma.client.userBranchAccess.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.removeUser(BRANCH_ID, TENANT_ID, "u2", ACTOR_GLOBAL, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
