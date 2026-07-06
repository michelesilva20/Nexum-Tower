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
  AssignDriverBranchesDto,
  CreateDriverDto,
  ListDriversQueryDto,
  UpdateDriverDto,
} from "./dto/driver.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const DRIVER_SELECT = {
  id: true,
  tenantId: true,
  code: true,
  fullName: true,
  preferredName: true,
  driverType: true,
  employmentType: true,
  documentType: true,
  documentNumber: true,
  licenseNumber: true,
  licenseCategory: true,
  licenseState: true,
  licenseCountry: true,
  licenseIssuedAt: true,
  licenseExpiresAt: true,
  hasEar: true,
  moppCertified: true,
  moppExpiresAt: true,
  birthDate: true,
  email: true,
  phone: true,
  whatsapp: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  emergencyContactRelation: true,
  addressLine1: true,
  addressLine2: true,
  district: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
  admissionDate: true,
  terminationDate: true,
  contractorCompanyName: true,
  availabilityStatus: true,
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

const SORT_WHITELIST: Record<string, keyof Prisma.DriverOrderByWithRelationInput> = {
  code: "code",
  fullName: "fullName",
  driverType: "driverType",
  employmentType: "employmentType",
  status: "status",
  availabilityStatus: "availabilityStatus",
  licenseExpiresAt: "licenseExpiresAt",
  moppExpiresAt: "moppExpiresAt",
  city: "city",
  state: "state",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

const CODE_CONFLICT_MESSAGE =
  "Não é possível reutilizar este código de motorista. Ele já foi usado neste tenant.";

const DOCUMENT_CONFLICT_MESSAGE =
  "Já existe um motorista ativo com este documento neste tenant.";

const LICENSE_CONFLICT_MESSAGE =
  "Já existe um motorista ativo com esta CNH neste tenant.";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function parseOptionalDate(value?: string | null): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  return new Date(value);
}

export type DriverWithBranches = Prisma.DriverGetPayload<{ select: typeof DRIVER_SELECT }> & {
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
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListDriversQueryDto,
  ): Promise<PaginatedResult<DriverWithBranches>> {
    const { page, perPage, skip, take } = resolvePagination({
      page: query.page,
      perPage: query.perPage ?? query.pageSize,
    });

    const where = await this.buildListWhere(tenantId, actor, query);
    const sortField =
      query.sortBy && SORT_WHITELIST[query.sortBy] ? SORT_WHITELIST[query.sortBy] : "fullName";
    const sortDir = query.sortDirection === "desc" ? "desc" : "asc";

    const [items, total] = await Promise.all([
      this.prisma.client.driver.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take,
        select: {
          ...DRIVER_SELECT,
          branches: {
            where: { deletedAt: null },
            select: BRANCH_LINK_SELECT,
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      }),
      this.prisma.client.driver.count({ where }),
    ]);

    return buildPaginatedResult(
      await this.applyBranchVisibilityToDrivers(items as DriverWithBranches[], tenantId, actor),
      total,
      page,
      perPage,
    );
  }

  async getById(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertDriverReadAccess(id, tenantId, actor);
    const driver = await this.prisma.client.driver.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...DRIVER_SELECT,
        branches: {
          where: { deletedAt: null },
          select: BRANCH_LINK_SELECT,
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!driver) {
      throw new NotFoundException("Motorista não encontrado.");
    }
    return this.applyBranchVisibilityToDriver(driver as DriverWithBranches, tenantId, actor);
  }

  async create(tenantId: string, dto: CreateDriverDto, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertDriverGlobalMutationAllowed(actor.permissions);
    const code = normalizeCode(dto.code);
    await this.assertUniqueCode(tenantId, code);

    const branchIds = [...new Set(dto.branchIds)];
    if (branchIds.length === 0) {
      throw new BadRequestException("Informe ao menos uma filial vinculada.");
    }
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);

    if (dto.primaryBranchId && !branchIds.includes(dto.primaryBranchId)) {
      throw new BadRequestException("Filial principal deve estar entre as filiais selecionadas.");
    }
    const primaryBranchId = dto.primaryBranchId ?? branchIds[0];

    const status = dto.status ?? "ACTIVE";
    const licenseNumber = dto.licenseNumber?.trim() || null;
    const licenseCategory = dto.licenseCategory ?? null;
    const licenseExpiresAt = parseOptionalDate(dto.licenseExpiresAt) ?? null;
    const moppCertified = dto.moppCertified ?? false;
    const moppExpiresAt = parseOptionalDate(dto.moppExpiresAt) ?? null;
    const admissionDate = parseOptionalDate(dto.admissionDate) ?? null;
    const terminationDate = parseOptionalDate(dto.terminationDate) ?? null;
    const documentNumber = dto.documentNumber?.trim() || null;

    this.validateDriverBusinessRules({
      status,
      licenseNumber,
      licenseCategory,
      licenseExpiresAt,
      moppCertified,
      moppExpiresAt,
      admissionDate,
      terminationDate,
    });

    if (documentNumber) {
      await this.assertUniqueDocument(tenantId, documentNumber);
    }
    if (licenseNumber) {
      await this.assertUniqueLicense(tenantId, licenseNumber);
    }

    const driver = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.driver.create({
        data: {
          tenantId,
          code,
          fullName: dto.fullName.trim(),
          preferredName: dto.preferredName?.trim(),
          driverType: dto.driverType,
          employmentType: dto.employmentType,
          documentType: dto.documentType ?? null,
          documentNumber,
          licenseNumber,
          licenseCategory,
          licenseState: dto.licenseState?.trim()?.toUpperCase(),
          licenseCountry: dto.licenseCountry?.trim()?.toUpperCase() ?? "BR",
          licenseIssuedAt: parseOptionalDate(dto.licenseIssuedAt) ?? null,
          licenseExpiresAt,
          hasEar: dto.hasEar ?? false,
          moppCertified,
          moppExpiresAt,
          birthDate: parseOptionalDate(dto.birthDate) ?? null,
          email: dto.email?.trim().toLowerCase(),
          phone: dto.phone?.trim(),
          whatsapp: dto.whatsapp?.trim(),
          emergencyContactName: dto.emergencyContactName?.trim(),
          emergencyContactPhone: dto.emergencyContactPhone?.trim(),
          emergencyContactRelation: dto.emergencyContactRelation?.trim(),
          addressLine1: dto.addressLine1?.trim(),
          addressLine2: dto.addressLine2?.trim(),
          district: dto.district?.trim(),
          city: dto.city?.trim(),
          state: dto.state?.trim()?.toUpperCase(),
          country: dto.country?.trim()?.toUpperCase() ?? "BR",
          zipCode: dto.zipCode?.trim(),
          admissionDate,
          terminationDate,
          contractorCompanyName: dto.contractorCompanyName?.trim(),
          availabilityStatus: dto.availabilityStatus ?? "AVAILABLE",
          status,
          notes: dto.notes?.trim(),
        },
        select: DRIVER_SELECT,
      });

      for (const branchId of branchIds) {
        await tx.driverBranch.create({
          data: {
            tenantId,
            driverId: created.id,
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
      action: AuditAction.DRIVER_CREATED,
      entity: "Driver",
      entityId: driver.id,
      metadata: {
        driverId: driver.id,
        driverCode: driver.code,
        driverName: driver.fullName,
        driverType: driver.driverType,
        employmentType: driver.employmentType,
        branchIds,
        primaryBranchId,
      },
      ...meta,
    });

    return this.getById(driver.id, tenantId, actor);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateDriverDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertDriverGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    const nextStatus = dto.status ?? existing.status;
    const nextLicenseNumber =
      dto.licenseNumber !== undefined ? dto.licenseNumber?.trim() || null : existing.licenseNumber;
    const nextLicenseCategory =
      dto.licenseCategory !== undefined ? dto.licenseCategory : existing.licenseCategory;
    const nextLicenseExpiresAt =
      dto.licenseExpiresAt !== undefined
        ? parseOptionalDate(dto.licenseExpiresAt) ?? null
        : existing.licenseExpiresAt;
    const nextMoppCertified = dto.moppCertified ?? existing.moppCertified;
    const nextMoppExpiresAt =
      dto.moppExpiresAt !== undefined
        ? parseOptionalDate(dto.moppExpiresAt) ?? null
        : existing.moppExpiresAt;
    const nextAdmissionDate =
      dto.admissionDate !== undefined
        ? parseOptionalDate(dto.admissionDate) ?? null
        : existing.admissionDate;
    const nextTerminationDate =
      dto.terminationDate !== undefined
        ? parseOptionalDate(dto.terminationDate) ?? null
        : existing.terminationDate;
    const nextDocumentNumber =
      dto.documentNumber !== undefined ? dto.documentNumber?.trim() || null : existing.documentNumber;

    this.validateDriverBusinessRules({
      status: nextStatus,
      licenseNumber: nextLicenseNumber,
      licenseCategory: nextLicenseCategory,
      licenseExpiresAt: nextLicenseExpiresAt,
      moppCertified: nextMoppCertified,
      moppExpiresAt: nextMoppExpiresAt,
      admissionDate: nextAdmissionDate,
      terminationDate: nextTerminationDate,
    });

    if (nextDocumentNumber && nextDocumentNumber !== existing.documentNumber) {
      await this.assertUniqueDocument(tenantId, nextDocumentNumber, id);
    }
    if (nextLicenseNumber && nextLicenseNumber !== existing.licenseNumber) {
      await this.assertUniqueLicense(tenantId, nextLicenseNumber, id);
    }

    const driver = await this.prisma.client.driver.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim(),
        preferredName: dto.preferredName?.trim(),
        driverType: dto.driverType,
        employmentType: dto.employmentType,
        documentType: dto.documentType !== undefined ? dto.documentType : undefined,
        documentNumber: dto.documentNumber !== undefined ? nextDocumentNumber : undefined,
        licenseNumber: dto.licenseNumber !== undefined ? nextLicenseNumber : undefined,
        licenseCategory: dto.licenseCategory !== undefined ? dto.licenseCategory : undefined,
        licenseState: dto.licenseState?.trim()?.toUpperCase(),
        licenseCountry: dto.licenseCountry?.trim()?.toUpperCase(),
        licenseIssuedAt:
          dto.licenseIssuedAt !== undefined ? parseOptionalDate(dto.licenseIssuedAt) ?? null : undefined,
        licenseExpiresAt:
          dto.licenseExpiresAt !== undefined ? nextLicenseExpiresAt : undefined,
        hasEar: dto.hasEar !== undefined ? dto.hasEar : undefined,
        moppCertified: dto.moppCertified !== undefined ? dto.moppCertified : undefined,
        moppExpiresAt: dto.moppExpiresAt !== undefined ? nextMoppExpiresAt : undefined,
        birthDate: dto.birthDate !== undefined ? parseOptionalDate(dto.birthDate) ?? null : undefined,
        email: dto.email?.trim().toLowerCase(),
        phone: dto.phone?.trim(),
        whatsapp: dto.whatsapp?.trim(),
        emergencyContactName: dto.emergencyContactName?.trim(),
        emergencyContactPhone: dto.emergencyContactPhone?.trim(),
        emergencyContactRelation: dto.emergencyContactRelation?.trim(),
        addressLine1: dto.addressLine1?.trim(),
        addressLine2: dto.addressLine2?.trim(),
        district: dto.district?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim()?.toUpperCase(),
        country: dto.country?.trim()?.toUpperCase(),
        zipCode: dto.zipCode?.trim(),
        admissionDate: dto.admissionDate !== undefined ? nextAdmissionDate : undefined,
        terminationDate: dto.terminationDate !== undefined ? nextTerminationDate : undefined,
        contractorCompanyName: dto.contractorCompanyName?.trim(),
        availabilityStatus: dto.availabilityStatus,
        status: dto.status,
        notes: dto.notes?.trim(),
      },
      select: DRIVER_SELECT,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.DRIVER_UPDATED,
      entity: "Driver",
      entityId: id,
      metadata: {
        driverId: id,
        driverCode: driver.code,
        driverName: driver.fullName,
        driverType: driver.driverType,
        employmentType: driver.employmentType,
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async disable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertDriverGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.driver.update({
      where: { id },
      data: { status: "DISABLED", disabledAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.DRIVER_DISABLED,
      entity: "Driver",
      entityId: id,
      metadata: {
        driverId: id,
        driverCode: existing.code,
        previousStatus: existing.status,
        newStatus: "DISABLED",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async enable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertDriverGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    this.validateDriverBusinessRules({
      status: "ACTIVE",
      licenseNumber: existing.licenseNumber,
      licenseCategory: existing.licenseCategory,
      licenseExpiresAt: existing.licenseExpiresAt,
      moppCertified: existing.moppCertified,
      moppExpiresAt: existing.moppExpiresAt,
      admissionDate: existing.admissionDate,
      terminationDate: existing.terminationDate,
    });

    await this.prisma.client.driver.update({
      where: { id },
      data: { status: "ACTIVE", disabledAt: null },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.DRIVER_ENABLED,
      entity: "Driver",
      entityId: id,
      metadata: {
        driverId: id,
        driverCode: existing.code,
        previousStatus: existing.status,
        newStatus: "ACTIVE",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertDriverGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.driver.update({
        where: { id },
        data: { status: "DISABLED", deletedAt: new Date(), disabledAt: new Date() },
      });
      await tx.driverBranch.updateMany({
        where: { tenantId, driverId: id, deletedAt: null },
        data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.DRIVER_DELETED,
      entity: "Driver",
      entityId: id,
      metadata: {
        driverId: id,
        driverCode: existing.code,
        driverName: existing.fullName,
      },
      ...meta,
    });

    return { success: true };
  }

  async listBranches(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertDriverReadAccess(id, tenantId, actor);
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    return this.prisma.client.driverBranch.findMany({
      where: {
        tenantId,
        driverId: id,
        deletedAt: null,
        ...(accessible !== null ? { branchId: { in: accessible } } : {}),
      },
      select: BRANCH_LINK_SELECT,
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  async assignBranches(
    id: string,
    tenantId: string,
    dto: AssignDriverBranchesDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertDriverBranchMutationAllowed(actor.permissions);
    const driver = await this.getExisting(id, tenantId);
    const branchIds = [...new Set(dto.branchIds)];
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);

    await this.prisma.client.$transaction(async (tx) => {
      for (const branchId of branchIds) {
        await tx.driverBranch.upsert({
          where: { tenantId_driverId_branchId: { tenantId, driverId: id, branchId } },
          update: { deletedAt: null, disabledAt: null, status: "ACTIVE" },
          create: { tenantId, driverId: id, branchId },
        });
      }
    });

    if (dto.primaryBranchId) {
      await this.setPrimaryBranch(id, tenantId, { branchId: dto.primaryBranchId }, actor, meta, false);
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.DRIVER_BRANCH_ASSIGNED,
      entity: "DriverBranch",
      entityId: id,
      metadata: {
        driverId: id,
        driverCode: driver.code,
        branchIds,
      },
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
    this.authorization.assertDriverBranchMutationAllowed(actor.permissions);
    const driver = await this.getExisting(id, tenantId);

    const link = await this.prisma.client.driverBranch.findFirst({
      where: { tenantId, driverId: id, branchId: dto.branchId, deletedAt: null },
      select: { id: true },
    });
    if (!link) {
      throw new BadRequestException("Filial não está vinculada a este motorista.");
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.driverBranch.updateMany({
        where: { tenantId, driverId: id, deletedAt: null },
        data: { isPrimary: false },
      });
      await tx.driverBranch.update({
        where: { id: link.id },
        data: { isPrimary: true },
      });
    });

    if (audit) {
      await this.audit.log({
        tenantId,
        userId: actor.userId,
        action: AuditAction.DRIVER_PRIMARY_BRANCH_CHANGED,
        entity: "DriverBranch",
        entityId: link.id,
        metadata: {
          driverId: id,
          driverCode: driver.code,
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
    this.authorization.assertDriverBranchMutationAllowed(actor.permissions);
    const driver = await this.getExisting(id, tenantId);

    const activeCount = await this.prisma.client.driverBranch.count({
      where: { tenantId, driverId: id, deletedAt: null },
    });
    if (activeCount <= 1) {
      throw new BadRequestException("Não é possível remover a última filial ativa do motorista.");
    }

    const deleted = await this.prisma.client.driverBranch.updateMany({
      where: { tenantId, driverId: id, branchId, deletedAt: null },
      data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Vínculo motorista-filial não encontrado.");
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.DRIVER_BRANCH_REMOVED,
      entity: "DriverBranch",
      entityId: id,
      metadata: { driverId: id, driverCode: driver.code, branchId },
      ...meta,
    });

    return this.listBranches(id, tenantId, actor);
  }

  private validateDriverBusinessRules(params: {
    status: string;
    licenseNumber?: string | null;
    licenseCategory?: string | null;
    licenseExpiresAt?: Date | null;
    moppCertified: boolean;
    moppExpiresAt?: Date | null;
    admissionDate?: Date | null;
    terminationDate?: Date | null;
  }) {
    const {
      status,
      licenseNumber,
      licenseCategory,
      licenseExpiresAt,
      moppCertified,
      moppExpiresAt,
      admissionDate,
      terminationDate,
    } = params;

    const requiresLicense =
      status === "ACTIVE" || (licenseNumber != null && licenseNumber !== "");

    if (requiresLicense) {
      if (!licenseNumber) {
        throw new BadRequestException("CNH é obrigatória para motoristas ativos ou quando informada.");
      }
      if (!licenseCategory) {
        throw new BadRequestException("Categoria da CNH é obrigatória quando a CNH é informada.");
      }
      if (!licenseExpiresAt) {
        throw new BadRequestException("Validade da CNH é obrigatória quando a CNH é informada.");
      }
    }

    if (moppCertified && !moppExpiresAt) {
      throw new BadRequestException("Validade MOPP é obrigatória quando MOPP certificado.");
    }

    if (admissionDate && terminationDate && terminationDate < admissionDate) {
      throw new BadRequestException("Data de desligamento não pode ser anterior à admissão.");
    }
  }

  private async buildListWhere(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListDriversQueryDto,
  ): Promise<Prisma.DriverWhereInput> {
    const where: Prisma.DriverWhereInput = { tenantId, deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.availabilityStatus) where.availabilityStatus = query.availabilityStatus;
    if (query.driverType) where.driverType = query.driverType;
    if (query.employmentType) where.employmentType = query.employmentType;
    if (query.licenseCategory) where.licenseCategory = query.licenseCategory;

    if (query.city?.trim()) {
      where.city = { contains: query.city.trim(), mode: "insensitive" };
    }
    if (query.state?.trim()) {
      where.state = { equals: query.state.trim().toUpperCase(), mode: "insensitive" };
    }

    if (query.licenseExpiringUntil) {
      where.licenseExpiresAt = {
        lte: new Date(query.licenseExpiringUntil),
        not: null,
      };
    }
    if (query.moppExpiringUntil) {
      where.moppExpiresAt = {
        lte: new Date(query.moppExpiringUntil),
        not: null,
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { fullName: { contains: term, mode: "insensitive" } },
        { preferredName: { contains: term, mode: "insensitive" } },
        { documentNumber: { contains: term, mode: "insensitive" } },
        { licenseNumber: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { whatsapp: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { state: { contains: term, mode: "insensitive" } },
        { contractorCompanyName: { contains: term, mode: "insensitive" } },
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
    if (this.authorization.hasGlobalDriverScope(actor.permissions)) {
      return null;
    }
    const rows = await this.prisma.client.userBranchAccess.findMany({
      where: { tenantId, userId: actor.userId },
      select: { branchId: true },
    });
    return rows.map((r) => r.branchId);
  }

  private async assertDriverReadAccess(driverId: string, tenantId: string, actor: AuthUserPayload) {
    const driver = await this.getExisting(driverId, tenantId);
    this.authorization.assertSameTenant(driver.tenantId, tenantId);

    if (this.authorization.hasGlobalDriverScope(actor.permissions)) {
      return driver;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible || accessible.length === 0) {
      throw new ForbiddenException("Você não possui acesso a este motorista.");
    }

    const link = await this.prisma.client.driverBranch.findFirst({
      where: {
        tenantId,
        driverId,
        branchId: { in: accessible },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException("Você não possui acesso a este motorista.");
    }

    return driver;
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

    if (this.authorization.hasGlobalDriverScope(actor.permissions)) {
      return;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    const missing = branchIds.filter((id) => !accessible?.includes(id));
    if (missing.length > 0) {
      throw new ForbiddenException("Você não possui acesso a uma ou mais filiais informadas.");
    }
  }

  private async applyBranchVisibilityToDriver(
    driver: DriverWithBranches,
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<DriverWithBranches> {
    if (this.authorization.hasGlobalDriverScope(actor.permissions)) {
      return driver;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return driver;
    }
    return {
      ...driver,
      branches: driver.branches.filter((link) => accessible.includes(link.branchId)),
    };
  }

  private async applyBranchVisibilityToDrivers(
    drivers: DriverWithBranches[],
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<DriverWithBranches[]> {
    if (this.authorization.hasGlobalDriverScope(actor.permissions)) {
      return drivers;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return drivers;
    }
    return drivers.map((driver) => ({
      ...driver,
      branches: driver.branches.filter((link) => accessible.includes(link.branchId)),
    }));
  }

  private async getExisting(id: string, tenantId: string) {
    const driver = await this.prisma.client.driver.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        code: true,
        fullName: true,
        driverType: true,
        employmentType: true,
        status: true,
        documentNumber: true,
        licenseNumber: true,
        licenseCategory: true,
        licenseExpiresAt: true,
        moppCertified: true,
        moppExpiresAt: true,
        admissionDate: true,
        terminationDate: true,
      },
    });
    if (!driver) {
      throw new NotFoundException("Motorista não encontrado.");
    }
    this.authorization.assertSameTenant(driver.tenantId, tenantId);
    return driver;
  }

  private async assertUniqueCode(tenantId: string, code: string, excludeId?: string) {
    const existing = await this.prisma.client.driver.findFirst({
      where: { tenantId, code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(CODE_CONFLICT_MESSAGE);
    }
  }

  private async assertUniqueDocument(tenantId: string, documentNumber: string, excludeId?: string) {
    const existing = await this.prisma.client.driver.findFirst({
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

  private async assertUniqueLicense(tenantId: string, licenseNumber: string, excludeId?: string) {
    const existing = await this.prisma.client.driver.findFirst({
      where: {
        tenantId,
        licenseNumber,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(LICENSE_CONFLICT_MESSAGE);
    }
  }
}
