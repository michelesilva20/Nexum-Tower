import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  buildPaginatedResult,
  resolvePagination,
  type PaginatedResult,
} from "../../common/pagination";
import { AuditAction } from "../../common/audit-actions";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthorizationService } from "../authorization/authorization.service";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import {
  AssignUserBranchDto,
  CreateBranchDto,
  ListBranchesQueryDto,
  UpdateBranchDto,
} from "./dto/branch.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const BRANCH_SELECT = {
  id: true,
  code: true,
  name: true,
  legalName: true,
  documentType: true,
  documentNumber: true,
  email: true,
  phone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
  status: true,
  isHeadquarters: true,
  createdAt: true,
  updatedAt: true,
  disabledAt: true,
  deletedAt: true,
} as const;

const SORT_WHITELIST: Record<string, keyof Prisma.BranchOrderByWithRelationInput> = {
  code: "code",
  name: "name",
  city: "city",
  state: "state",
  status: "status",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

const CODE_CONFLICT_MESSAGE =
  "Não é possível reutilizar este código de filial. Ele já foi usado neste tenant.";

const DOCUMENT_CONFLICT_MESSAGE =
  "Já existe uma filial ativa com este documento neste tenant.";

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListBranchesQueryDto,
  ): Promise<PaginatedResult<Prisma.BranchGetPayload<{ select: typeof BRANCH_SELECT }>>> {
    const { page, perPage, skip, take } = resolvePagination({
      page: query.page,
      perPage: query.perPage ?? query.pageSize,
    });

    const where = await this.buildListWhere(tenantId, actor, query);

    const sortField = query.sortBy && SORT_WHITELIST[query.sortBy] ? SORT_WHITELIST[query.sortBy] : "name";
    const sortDir = query.sortDirection === "desc" ? "desc" : "asc";

    const [items, total] = await Promise.all([
      this.prisma.client.branch.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take,
        select: BRANCH_SELECT,
      }),
      this.prisma.client.branch.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, perPage);
  }

  async getById(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertBranchAccess(id, tenantId, actor);
    const branch = await this.prisma.client.branch.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: BRANCH_SELECT,
    });
    if (!branch) {
      throw new NotFoundException("Filial não encontrada.");
    }
    return branch;
  }

  async create(tenantId: string, dto: CreateBranchDto, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertGlobalBranchScope(actor.permissions);

    const code = normalizeCode(dto.code);
    await this.assertUniqueCode(tenantId, code);
    if (dto.documentNumber) {
      await this.assertUniqueDocument(tenantId, dto.documentNumber);
    }

    const branch = await this.prisma.client.$transaction(async (tx) => {
      if (dto.isHeadquarters) {
        await tx.branch.updateMany({
          where: { tenantId, isHeadquarters: true, deletedAt: null },
          data: { isHeadquarters: false },
        });
      }

      return tx.branch.create({
        data: {
          tenantId,
          code,
          name: dto.name.trim(),
          legalName: dto.legalName?.trim(),
          documentType: dto.documentType?.trim(),
          documentNumber: dto.documentNumber?.trim(),
          email: dto.email?.trim().toLowerCase(),
          phone: dto.phone?.trim(),
          addressLine1: dto.addressLine1?.trim(),
          addressLine2: dto.addressLine2?.trim(),
          city: dto.city?.trim(),
          state: dto.state?.trim()?.toUpperCase(),
          country: dto.country?.trim()?.toUpperCase() ?? "BR",
          zipCode: dto.zipCode?.trim(),
          status: dto.status ?? "ACTIVE",
          isHeadquarters: dto.isHeadquarters ?? false,
        },
        select: BRANCH_SELECT,
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.BRANCH_CREATED,
      entity: "Branch",
      entityId: branch.id,
      metadata: { branchId: branch.id, branchCode: branch.code, branchName: branch.name },
      ...meta,
    });

    return branch;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateBranchDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertGlobalBranchScope(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    if (dto.code && normalizeCode(dto.code) !== existing.code) {
      await this.assertUniqueCode(tenantId, normalizeCode(dto.code), id);
    }
    if (dto.documentNumber && dto.documentNumber !== existing.documentNumber) {
      await this.assertUniqueDocument(tenantId, dto.documentNumber, id);
    }

    const branch = await this.prisma.client.$transaction(async (tx) => {
      if (dto.isHeadquarters) {
        await tx.branch.updateMany({
          where: { tenantId, isHeadquarters: true, deletedAt: null, NOT: { id } },
          data: { isHeadquarters: false },
        });
      }

      return tx.branch.update({
        where: { id },
        data: {
          code: dto.code ? normalizeCode(dto.code) : undefined,
          name: dto.name?.trim(),
          legalName: dto.legalName?.trim(),
          documentType: dto.documentType?.trim(),
          documentNumber: dto.documentNumber?.trim(),
          email: dto.email?.trim().toLowerCase(),
          phone: dto.phone?.trim(),
          addressLine1: dto.addressLine1?.trim(),
          addressLine2: dto.addressLine2?.trim(),
          city: dto.city?.trim(),
          state: dto.state?.trim()?.toUpperCase(),
          country: dto.country?.trim()?.toUpperCase(),
          zipCode: dto.zipCode?.trim(),
          status: dto.status,
          isHeadquarters: dto.isHeadquarters,
        },
        select: BRANCH_SELECT,
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.BRANCH_UPDATED,
      entity: "Branch",
      entityId: id,
      metadata: { branchId: id, branchCode: branch.code, branchName: branch.name },
      ...meta,
    });

    return branch;
  }

  async disable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertGlobalBranchScope(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    const branch = await this.prisma.client.branch.update({
      where: { id },
      data: { status: "DISABLED", disabledAt: new Date() },
      select: BRANCH_SELECT,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.BRANCH_DISABLED,
      entity: "Branch",
      entityId: id,
      metadata: {
        branchId: id,
        branchCode: existing.code,
        previousStatus: existing.status,
        newStatus: "DISABLED",
      },
      ...meta,
    });

    return branch;
  }

  async enable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertGlobalBranchScope(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    const branch = await this.prisma.client.branch.update({
      where: { id },
      data: { status: "ACTIVE", disabledAt: null },
      select: BRANCH_SELECT,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.BRANCH_ENABLED,
      entity: "Branch",
      entityId: id,
      metadata: {
        branchId: id,
        branchCode: existing.code,
        previousStatus: existing.status,
        newStatus: "ACTIVE",
      },
      ...meta,
    });

    return branch;
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertGlobalBranchScope(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.branch.update({
      where: { id },
      data: {
        status: "DISABLED",
        deletedAt: new Date(),
        disabledAt: new Date(),
        isHeadquarters: false,
      },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.BRANCH_DELETED,
      entity: "Branch",
      entityId: id,
      metadata: { branchId: id, branchCode: existing.code, branchName: existing.name },
      ...meta,
    });

    return { success: true };
  }

  async listUsers(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertBranchAccess(id, tenantId, actor);

    const rows = await this.prisma.client.userBranchAccess.findMany({
      where: { tenantId, branchId: id },
      select: {
        id: true,
        scope: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      scope: row.scope,
      createdAt: row.createdAt,
      user: row.user,
    }));
  }

  async assignUser(
    id: string,
    tenantId: string,
    dto: AssignUserBranchDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    await this.assertBranchAccess(id, tenantId, actor);
    await this.assertUserInTenant(tenantId, dto.userId);
    await this.assertBranchBelongsToTenant(id, tenantId);

    const access = await this.prisma.client.userBranchAccess.upsert({
      where: {
        tenantId_userId_branchId: { tenantId, userId: dto.userId, branchId: id },
      },
      update: { scope: dto.scope ?? "MEMBER" },
      create: {
        tenantId,
        userId: dto.userId,
        branchId: id,
        scope: dto.scope ?? "MEMBER",
        createdByUserId: actor.userId,
      },
      select: {
        id: true,
        scope: true,
        user: { select: { id: true, name: true, email: true, status: true } },
      },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.BRANCH_USER_ASSIGNED,
      entity: "UserBranchAccess",
      entityId: access.id,
      metadata: { branchId: id, targetUserId: dto.userId, scope: access.scope },
      ...meta,
    });

    return access;
  }

  async removeUser(
    id: string,
    tenantId: string,
    userId: string,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    await this.assertBranchAccess(id, tenantId, actor);
    await this.assertUserInTenant(tenantId, userId);
    await this.assertBranchBelongsToTenant(id, tenantId);

    const deleted = await this.prisma.client.userBranchAccess.deleteMany({
      where: { tenantId, branchId: id, userId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Vínculo usuário-filial não encontrado.");
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.BRANCH_USER_REMOVED,
      entity: "UserBranchAccess",
      entityId: id,
      metadata: { branchId: id, targetUserId: userId },
      ...meta,
    });

    return { success: true };
  }

  private async buildListWhere(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListBranchesQueryDto,
  ): Promise<Prisma.BranchWhereInput> {
    const where: Prisma.BranchWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.isHeadquarters !== undefined) {
      where.isHeadquarters = query.isHeadquarters;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { legalName: { contains: term, mode: "insensitive" } },
        { documentNumber: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { state: { contains: term, mode: "insensitive" } },
      ];
    }

    if (!this.authorization.hasGlobalBranchScope(actor.permissions)) {
      const accessRows = await this.prisma.client.userBranchAccess.findMany({
        where: { tenantId, userId: actor.userId },
        select: { branchId: true },
      });
      const branchIds = accessRows.map((r) => r.branchId);
      if (branchIds.length === 0) {
        where.id = { in: [] };
      } else {
        where.id = { in: branchIds };
      }
    }

    return where;
  }

  private async assertBranchAccess(branchId: string, tenantId: string, actor: AuthUserPayload) {
    const branch = await this.getExisting(branchId, tenantId);
    this.authorization.assertSameTenant(branch.tenantId, tenantId);

    if (this.authorization.hasGlobalBranchScope(actor.permissions)) {
      return branch;
    }

    const access = await this.prisma.client.userBranchAccess.findFirst({
      where: { tenantId, userId: actor.userId, branchId },
      select: { id: true },
    });

    if (!access) {
      throw new ForbiddenException("Você não possui acesso a esta filial.");
    }

    return branch;
  }

  private async getExisting(id: string, tenantId: string) {
    const branch = await this.prisma.client.branch.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, tenantId: true, code: true, name: true, status: true, documentNumber: true },
    });
    if (!branch) {
      throw new NotFoundException("Filial não encontrada.");
    }
    this.authorization.assertSameTenant(branch.tenantId, tenantId);
    return branch;
  }

  private async assertUniqueCode(tenantId: string, code: string, excludeId?: string) {
    const existing = await this.prisma.client.branch.findFirst({
      where: { tenantId, code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true, deletedAt: true },
    });
    if (existing) {
      throw new ConflictException(CODE_CONFLICT_MESSAGE);
    }
  }

  private async assertUniqueDocument(tenantId: string, documentNumber: string, excludeId?: string) {
    const existing = await this.prisma.client.branch.findFirst({
      where: {
        tenantId,
        documentNumber,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(DOCUMENT_CONFLICT_MESSAGE);
    }
  }

  private async assertUserInTenant(tenantId: string, userId: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException("Usuário não pertence ao tenant.");
    }
  }

  private async assertBranchBelongsToTenant(branchId: string, tenantId: string) {
    const branch = await this.prisma.client.branch.findFirst({
      where: { id: branchId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!branch) {
      throw new NotFoundException("Filial não pertence ao tenant.");
    }
  }
}
