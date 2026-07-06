import {
  BadRequestException,
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
  AssignCustomerBranchesDto,
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from "./dto/customer.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const CUSTOMER_SELECT = {
  id: true,
  tenantId: true,
  code: true,
  legalName: true,
  tradeName: true,
  customerType: true,
  documentType: true,
  documentNumber: true,
  stateRegistration: true,
  municipalRegistration: true,
  mainContactName: true,
  mainContactRole: true,
  email: true,
  billingEmail: true,
  phone: true,
  whatsapp: true,
  website: true,
  billingAddressLine1: true,
  billingAddressLine2: true,
  billingDistrict: true,
  billingCity: true,
  billingState: true,
  billingCountry: true,
  billingZipCode: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  disabledAt: true,
  deletedAt: true,
} as const;

const BRANCH_LINK_SELECT = {
  id: true,
  branchId: true,
  isPrimary: true,
  status: true,
  updatedAt: true,
  branch: { select: { id: true, code: true, name: true, status: true } },
} as const;

const SORT_WHITELIST: Record<string, keyof Prisma.CustomerOrderByWithRelationInput> = {
  code: "code",
  legalName: "legalName",
  tradeName: "tradeName",
  customerType: "customerType",
  status: "status",
  billingCity: "billingCity",
  billingState: "billingState",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

const CODE_CONFLICT_MESSAGE =
  "Não é possível reutilizar este código de cliente. Ele já foi usado neste tenant.";

const DOCUMENT_CONFLICT_MESSAGE =
  "Já existe um cliente ativo com este documento neste tenant.";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export type CustomerWithBranches = Prisma.CustomerGetPayload<{ select: typeof CUSTOMER_SELECT }> & {
  branches: Array<{
    id: string;
    branchId: string;
    isPrimary: boolean;
    status: string;
    updatedAt: Date;
    branch: { id: string; code: string; name: string; status: string };
  }>;
};

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListCustomersQueryDto,
  ): Promise<PaginatedResult<CustomerWithBranches>> {
    const { page, perPage, skip, take } = resolvePagination({
      page: query.page,
      perPage: query.perPage ?? query.pageSize,
    });

    const where = await this.buildListWhere(tenantId, actor, query);
    const sortField =
      query.sortBy && SORT_WHITELIST[query.sortBy] ? SORT_WHITELIST[query.sortBy] : "legalName";
    const sortDir = query.sortDirection === "desc" ? "desc" : "asc";

    const [items, total] = await Promise.all([
      this.prisma.client.customer.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take,
        select: {
          ...CUSTOMER_SELECT,
          branches: {
            where: { deletedAt: null },
            select: BRANCH_LINK_SELECT,
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      }),
      this.prisma.client.customer.count({ where }),
    ]);

    return buildPaginatedResult(
      await this.applyBranchVisibilityToCustomers(items as CustomerWithBranches[], tenantId, actor),
      total,
      page,
      perPage,
    );
  }

  async getById(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertCustomerReadAccess(id, tenantId, actor);
    const customer = await this.prisma.client.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...CUSTOMER_SELECT,
        branches: {
          where: { deletedAt: null },
          select: BRANCH_LINK_SELECT,
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado.");
    }
    return this.applyBranchVisibilityToCustomer(customer as CustomerWithBranches, tenantId, actor);
  }

  async create(tenantId: string, dto: CreateCustomerDto, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertCustomerGlobalMutationAllowed(actor.permissions);
    const code = normalizeCode(dto.code);
    await this.assertUniqueCode(tenantId, code);
    if (dto.documentNumber) {
      await this.assertUniqueDocument(tenantId, dto.documentNumber.trim());
    }
    if (dto.documentNumber && !dto.documentType) {
      throw new BadRequestException("Informe o tipo de documento quando o número for preenchido.");
    }

    const branchIds = [...new Set(dto.branchIds)];
    if (branchIds.length === 0) {
      throw new BadRequestException("Informe ao menos uma filial de atendimento.");
    }
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);
    if (dto.primaryBranchId && !branchIds.includes(dto.primaryBranchId)) {
      throw new BadRequestException("Filial principal deve estar entre as filiais selecionadas.");
    }
    const primaryBranchId = dto.primaryBranchId ?? branchIds[0];

    const customer = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          tenantId,
          code,
          legalName: dto.legalName.trim(),
          tradeName: dto.tradeName?.trim(),
          customerType: dto.customerType,
          documentType: dto.documentType,
          documentNumber: dto.documentNumber?.trim(),
          stateRegistration: dto.stateRegistration?.trim(),
          municipalRegistration: dto.municipalRegistration?.trim(),
          mainContactName: dto.mainContactName?.trim(),
          mainContactRole: dto.mainContactRole?.trim(),
          email: dto.email?.trim().toLowerCase(),
          billingEmail: dto.billingEmail?.trim().toLowerCase(),
          phone: dto.phone?.trim(),
          whatsapp: dto.whatsapp?.trim(),
          website: dto.website?.trim(),
          billingAddressLine1: dto.billingAddressLine1?.trim(),
          billingAddressLine2: dto.billingAddressLine2?.trim(),
          billingDistrict: dto.billingDistrict?.trim(),
          billingCity: dto.billingCity?.trim(),
          billingState: dto.billingState?.trim()?.toUpperCase(),
          billingCountry: dto.billingCountry?.trim()?.toUpperCase() ?? "BR",
          billingZipCode: dto.billingZipCode?.trim(),
          status: dto.status ?? "ACTIVE",
          notes: dto.notes?.trim(),
        },
        select: CUSTOMER_SELECT,
      });

      for (const branchId of branchIds) {
        await tx.customerBranch.create({
          data: {
            tenantId,
            customerId: created.id,
            branchId,
            isPrimary: branchId === primaryBranchId,
          },
        });
      }

      return created;
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.CUSTOMER_CREATED,
      entity: "Customer",
      entityId: customer.id,
      metadata: {
        customerId: customer.id,
        customerCode: customer.code,
        customerLegalName: customer.legalName,
        branchIds,
        primaryBranchId,
      },
      ...meta,
    });

    return this.getById(customer.id, tenantId, actor);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateCustomerDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertCustomerGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    if (dto.documentNumber && dto.documentNumber !== existing.documentNumber) {
      await this.assertUniqueDocument(tenantId, dto.documentNumber.trim(), id);
    }
    if (dto.documentNumber && !dto.documentType && !existing.documentType) {
      throw new BadRequestException("Informe o tipo de documento quando o número for preenchido.");
    }

    const customer = await this.prisma.client.customer.update({
      where: { id },
      data: {
        legalName: dto.legalName?.trim(),
        tradeName: dto.tradeName?.trim(),
        customerType: dto.customerType,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber?.trim(),
        stateRegistration: dto.stateRegistration?.trim(),
        municipalRegistration: dto.municipalRegistration?.trim(),
        mainContactName: dto.mainContactName?.trim(),
        mainContactRole: dto.mainContactRole?.trim(),
        email: dto.email?.trim().toLowerCase(),
        billingEmail: dto.billingEmail?.trim().toLowerCase(),
        phone: dto.phone?.trim(),
        whatsapp: dto.whatsapp?.trim(),
        website: dto.website?.trim(),
        billingAddressLine1: dto.billingAddressLine1?.trim(),
        billingAddressLine2: dto.billingAddressLine2?.trim(),
        billingDistrict: dto.billingDistrict?.trim(),
        billingCity: dto.billingCity?.trim(),
        billingState: dto.billingState?.trim()?.toUpperCase(),
        billingCountry: dto.billingCountry?.trim()?.toUpperCase(),
        billingZipCode: dto.billingZipCode?.trim(),
        status: dto.status,
        notes: dto.notes?.trim(),
      },
      select: CUSTOMER_SELECT,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.CUSTOMER_UPDATED,
      entity: "Customer",
      entityId: id,
      metadata: {
        customerId: id,
        customerCode: customer.code,
        customerLegalName: customer.legalName,
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async disable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertCustomerGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.customer.update({
      where: { id },
      data: { status: "DISABLED", disabledAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.CUSTOMER_DISABLED,
      entity: "Customer",
      entityId: id,
      metadata: {
        customerId: id,
        customerCode: existing.code,
        previousStatus: existing.status,
        newStatus: "DISABLED",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async enable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertCustomerGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.customer.update({
      where: { id },
      data: { status: "ACTIVE", disabledAt: null },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.CUSTOMER_ENABLED,
      entity: "Customer",
      entityId: id,
      metadata: {
        customerId: id,
        customerCode: existing.code,
        previousStatus: existing.status,
        newStatus: "ACTIVE",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertCustomerGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: { status: "DISABLED", deletedAt: new Date(), disabledAt: new Date() },
      });
      await tx.customerBranch.updateMany({
        where: { tenantId, customerId: id, deletedAt: null },
        data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.CUSTOMER_DELETED,
      entity: "Customer",
      entityId: id,
      metadata: {
        customerId: id,
        customerCode: existing.code,
        customerLegalName: existing.legalName,
      },
      ...meta,
    });

    return { success: true };
  }

  async listBranches(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertCustomerReadAccess(id, tenantId, actor);
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    const links = await this.prisma.client.customerBranch.findMany({
      where: {
        tenantId,
        customerId: id,
        deletedAt: null,
        ...(accessible !== null ? { branchId: { in: accessible } } : {}),
      },
      select: BRANCH_LINK_SELECT,
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return links;
  }

  async assignBranches(
    id: string,
    tenantId: string,
    dto: AssignCustomerBranchesDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertCustomerBranchMutationAllowed(actor.permissions);
    await this.getExisting(id, tenantId);
    const branchIds = [...new Set(dto.branchIds)];
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);

    const customer = await this.getExisting(id, tenantId);

    await this.prisma.client.$transaction(async (tx) => {
      for (const branchId of branchIds) {
        await tx.customerBranch.upsert({
          where: { tenantId_customerId_branchId: { tenantId, customerId: id, branchId } },
          update: { deletedAt: null, disabledAt: null, status: "ACTIVE" },
          create: { tenantId, customerId: id, branchId },
        });
      }
    });

    if (dto.primaryBranchId) {
      await this.setPrimaryBranch(id, tenantId, { branchId: dto.primaryBranchId }, actor, meta, false);
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.CUSTOMER_BRANCH_ASSIGNED,
      entity: "CustomerBranch",
      entityId: id,
      metadata: { customerId: id, customerCode: customer.code, branchIds },
      ...meta,
    });

    return this.listBranches(id, tenantId, actor);
  }

  async setPrimaryBranch(
    id: string,
    tenantId: string,
    dto: { branchId: string },
    actor: AuthUserPayload,
    meta: RequestMeta,
    audit = true,
  ) {
    this.authorization.assertCustomerBranchMutationAllowed(actor.permissions);
    const customer = await this.getExisting(id, tenantId);

    const link = await this.prisma.client.customerBranch.findFirst({
      where: { tenantId, customerId: id, branchId: dto.branchId, deletedAt: null },
      select: { id: true },
    });
    if (!link) {
      throw new BadRequestException("Filial não está vinculada a este cliente.");
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.customerBranch.updateMany({
        where: { tenantId, customerId: id, deletedAt: null },
        data: { isPrimary: false },
      });
      await tx.customerBranch.update({
        where: { id: link.id },
        data: { isPrimary: true },
      });
    });

    if (audit) {
      await this.audit.log({
        tenantId,
        userId: actor.userId,
        action: AuditAction.CUSTOMER_PRIMARY_BRANCH_CHANGED,
        entity: "CustomerBranch",
        entityId: link.id,
        metadata: {
          customerId: id,
          customerCode: customer.code,
          branchId: dto.branchId,
          primaryBranchId: dto.branchId,
        },
        ...meta,
      });
    }

    return this.listBranches(id, tenantId, actor);
  }

  async removeBranch(
    id: string,
    tenantId: string,
    branchId: string,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertCustomerBranchMutationAllowed(actor.permissions);
    const customer = await this.getExisting(id, tenantId);

    const activeCount = await this.prisma.client.customerBranch.count({
      where: { tenantId, customerId: id, deletedAt: null },
    });
    if (activeCount <= 1) {
      throw new BadRequestException("Não é possível remover a última filial ativa do cliente.");
    }

    const deleted = await this.prisma.client.customerBranch.updateMany({
      where: { tenantId, customerId: id, branchId, deletedAt: null },
      data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Vínculo cliente-filial não encontrado.");
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.CUSTOMER_BRANCH_REMOVED,
      entity: "CustomerBranch",
      entityId: id,
      metadata: { customerId: id, customerCode: customer.code, branchId },
      ...meta,
    });

    return this.listBranches(id, tenantId, actor);
  }

  private async buildListWhere(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListCustomersQueryDto,
  ): Promise<Prisma.CustomerWhereInput> {
    const where: Prisma.CustomerWhereInput = { tenantId, deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.customerType) where.customerType = query.customerType;
    if (query.documentType) where.documentType = query.documentType;
    if (query.city?.trim()) {
      where.billingCity = { contains: query.city.trim(), mode: "insensitive" };
    }
    if (query.state?.trim()) {
      where.billingState = { equals: query.state.trim().toUpperCase(), mode: "insensitive" };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { legalName: { contains: term, mode: "insensitive" } },
        { tradeName: { contains: term, mode: "insensitive" } },
        { documentNumber: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { billingEmail: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { mainContactName: { contains: term, mode: "insensitive" } },
        { billingCity: { contains: term, mode: "insensitive" } },
        { billingState: { contains: term, mode: "insensitive" } },
      ];
    }

    const branchFilter = query.branchId?.trim();
    const accessibleBranchIds = await this.getAccessibleBranchIds(tenantId, actor);

    if (branchFilter) {
      if (accessibleBranchIds !== null && !accessibleBranchIds.includes(branchFilter)) {
        where.id = { in: [] };
        return where;
      }
      where.branches = {
        some: { branchId: branchFilter, deletedAt: null, tenantId },
      };
    } else if (accessibleBranchIds !== null) {
      if (accessibleBranchIds.length === 0) {
        where.id = { in: [] };
      } else {
        where.branches = {
          some: { branchId: { in: accessibleBranchIds }, deletedAt: null, tenantId },
        };
      }
    }

    return where;
  }

  private async getAccessibleBranchIds(
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<string[] | null> {
    if (this.authorization.hasGlobalCustomerScope(actor.permissions)) {
      return null;
    }
    const rows = await this.prisma.client.userBranchAccess.findMany({
      where: { tenantId, userId: actor.userId },
      select: { branchId: true },
    });
    return rows.map((r) => r.branchId);
  }

  private async assertCustomerReadAccess(customerId: string, tenantId: string, actor: AuthUserPayload) {
    const customer = await this.getExisting(customerId, tenantId);
    this.authorization.assertSameTenant(customer.tenantId, tenantId);

    if (this.authorization.hasGlobalCustomerScope(actor.permissions)) {
      return customer;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible || accessible.length === 0) {
      throw new ForbiddenException("Você não possui acesso a este cliente.");
    }

    const link = await this.prisma.client.customerBranch.findFirst({
      where: {
        tenantId,
        customerId,
        branchId: { in: accessible },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException("Você não possui acesso a este cliente.");
    }

    return customer;
  }

  private async assertBranchesForAssignment(
    tenantId: string,
    branchIds: string[],
    actor: AuthUserPayload,
  ) {
    const branches = await this.prisma.client.branch.findMany({
      where: { tenantId, id: { in: branchIds }, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (branches.length !== branchIds.length) {
      throw new BadRequestException("Uma ou mais filiais são inválidas ou inativas.");
    }

    if (this.authorization.hasGlobalCustomerScope(actor.permissions)) {
      return;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    const missing = branchIds.filter((id) => !accessible?.includes(id));
    if (missing.length > 0) {
      throw new ForbiddenException("Você não possui acesso a uma ou mais filiais informadas.");
    }
  }

  private async applyBranchVisibilityToCustomer(
    customer: CustomerWithBranches,
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<CustomerWithBranches> {
    if (this.authorization.hasGlobalCustomerScope(actor.permissions)) {
      return customer;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return customer;
    }
    return {
      ...customer,
      branches: customer.branches.filter((link) => accessible.includes(link.branchId)),
    };
  }

  private async applyBranchVisibilityToCustomers(
    customers: CustomerWithBranches[],
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<CustomerWithBranches[]> {
    if (this.authorization.hasGlobalCustomerScope(actor.permissions)) {
      return customers;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return customers;
    }
    return customers.map((customer) => ({
      ...customer,
      branches: customer.branches.filter((link) => accessible.includes(link.branchId)),
    }));
  }

  private async getExisting(id: string, tenantId: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, tenantId: true, code: true, legalName: true, status: true, documentNumber: true, documentType: true },
    });
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado.");
    }
    this.authorization.assertSameTenant(customer.tenantId, tenantId);
    return customer;
  }

  private async assertUniqueCode(tenantId: string, code: string, excludeId?: string) {
    const existing = await this.prisma.client.customer.findFirst({
      where: { tenantId, code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(CODE_CONFLICT_MESSAGE);
    }
  }

  private async assertUniqueDocument(tenantId: string, documentNumber: string, excludeId?: string) {
    const existing = await this.prisma.client.customer.findFirst({
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
}
