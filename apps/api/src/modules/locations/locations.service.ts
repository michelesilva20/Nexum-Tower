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
  AssignLocationBranchesDto,
  CreateLocationDto,
  ListLocationsQueryDto,
  UpdateLocationDto,
} from "./dto/location.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const LOCATION_SELECT = {
  id: true,
  tenantId: true,
  code: true,
  name: true,
  locationType: true,
  customerId: true,
  addressLine1: true,
  addressLine2: true,
  district: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
  latitude: true,
  longitude: true,
  timezone: true,
  geofenceRadiusMeters: true,
  contactName: true,
  contactRole: true,
  email: true,
  phone: true,
  whatsapp: true,
  operatingHours: true,
  accessInstructions: true,
  dockInfo: true,
  referencePoint: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  disabledAt: true,
  deletedAt: true,
  customer: {
    select: { id: true, code: true, legalName: true, tradeName: true },
  },
} as const;

const BRANCH_LINK_SELECT = {
  id: true,
  branchId: true,
  isPrimary: true,
  status: true,
  updatedAt: true,
  branch: { select: { id: true, code: true, name: true, status: true } },
} as const;

const SORT_WHITELIST: Record<string, keyof Prisma.LocationOrderByWithRelationInput> = {
  code: "code",
  name: "name",
  locationType: "locationType",
  status: "status",
  city: "city",
  state: "state",
  country: "country",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

const CODE_CONFLICT_MESSAGE =
  "Não é possível reutilizar este código de local. Ele já foi usado neste tenant.";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export type LocationWithBranches = Prisma.LocationGetPayload<{ select: typeof LOCATION_SELECT }> & {
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
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListLocationsQueryDto,
  ): Promise<PaginatedResult<LocationWithBranches>> {
    const { page, perPage, skip, take } = resolvePagination({
      page: query.page,
      perPage: query.perPage ?? query.pageSize,
    });

    const where = await this.buildListWhere(tenantId, actor, query);
    const sortField =
      query.sortBy && SORT_WHITELIST[query.sortBy] ? SORT_WHITELIST[query.sortBy] : "name";
    const sortDir = query.sortDirection === "desc" ? "desc" : "asc";

    const [items, total] = await Promise.all([
      this.prisma.client.location.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take,
        select: {
          ...LOCATION_SELECT,
          branches: {
            where: { deletedAt: null },
            select: BRANCH_LINK_SELECT,
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      }),
      this.prisma.client.location.count({ where }),
    ]);

    return buildPaginatedResult(
      await this.applyBranchVisibilityToLocations(items as LocationWithBranches[], tenantId, actor),
      total,
      page,
      perPage,
    );
  }

  async getById(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertLocationReadAccess(id, tenantId, actor);
    const location = await this.prisma.client.location.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...LOCATION_SELECT,
        branches: {
          where: { deletedAt: null },
          select: BRANCH_LINK_SELECT,
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!location) {
      throw new NotFoundException("Local não encontrado.");
    }
    return this.applyBranchVisibilityToLocation(location as LocationWithBranches, tenantId, actor);
  }

  async create(tenantId: string, dto: CreateLocationDto, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertLocationGlobalMutationAllowed(actor.permissions);
    const code = normalizeCode(dto.code);
    await this.assertUniqueCode(tenantId, code);
    this.validateCoordinates(dto.latitude, dto.longitude, dto.geofenceRadiusMeters);

    if (dto.locationType === "CUSTOMER_SITE" && !dto.customerId) {
      throw new BadRequestException("Cliente é obrigatório para locais do tipo CUSTOMER_SITE.");
    }

    const branchIds = [...new Set(dto.branchIds)];
    if (branchIds.length === 0) {
      throw new BadRequestException("Informe ao menos uma filial vinculada.");
    }
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);

    if (dto.customerId) {
      await this.assertCustomerInTenant(tenantId, dto.customerId);
      await this.assertBranchesCompatibleWithCustomer(tenantId, dto.customerId, branchIds);
    }

    if (dto.primaryBranchId && !branchIds.includes(dto.primaryBranchId)) {
      throw new BadRequestException("Filial principal deve estar entre as filiais selecionadas.");
    }
    const primaryBranchId = dto.primaryBranchId ?? branchIds[0];

    const location = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.location.create({
        data: {
          tenantId,
          code,
          name: dto.name.trim(),
          locationType: dto.locationType,
          customerId: dto.customerId ?? null,
          addressLine1: dto.addressLine1.trim(),
          addressLine2: dto.addressLine2?.trim(),
          district: dto.district?.trim(),
          city: dto.city.trim(),
          state: dto.state.trim().toUpperCase(),
          country: dto.country?.trim()?.toUpperCase() ?? "BR",
          zipCode: dto.zipCode?.trim(),
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          timezone: dto.timezone?.trim(),
          geofenceRadiusMeters: dto.geofenceRadiusMeters ?? null,
          contactName: dto.contactName?.trim(),
          contactRole: dto.contactRole?.trim(),
          email: dto.email?.trim().toLowerCase(),
          phone: dto.phone?.trim(),
          whatsapp: dto.whatsapp?.trim(),
          operatingHours: dto.operatingHours?.trim(),
          accessInstructions: dto.accessInstructions?.trim(),
          dockInfo: dto.dockInfo?.trim(),
          referencePoint: dto.referencePoint?.trim(),
          status: dto.status ?? "ACTIVE",
          notes: dto.notes?.trim(),
        },
        select: LOCATION_SELECT,
      });

      for (const branchId of branchIds) {
        await tx.locationBranch.create({
          data: {
            tenantId,
            locationId: created.id,
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
      action: AuditAction.LOCATION_CREATED,
      entity: "Location",
      entityId: location.id,
      metadata: {
        locationId: location.id,
        locationCode: location.code,
        locationName: location.name,
        locationType: location.locationType,
        customerId: location.customerId,
        branchIds,
        primaryBranchId,
      },
      ...meta,
    });

    return this.getById(location.id, tenantId, actor);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateLocationDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertLocationGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    const nextType = dto.locationType ?? existing.locationType;
    const nextCustomerId =
      dto.customerId !== undefined ? dto.customerId : existing.customerId;

    if (nextType === "CUSTOMER_SITE" && !nextCustomerId) {
      throw new BadRequestException("Cliente é obrigatório para locais do tipo CUSTOMER_SITE.");
    }

    const nextLat = dto.latitude !== undefined ? dto.latitude : existing.latitude;
    const nextLng = dto.longitude !== undefined ? dto.longitude : existing.longitude;
    const nextGeofence =
      dto.geofenceRadiusMeters !== undefined
        ? dto.geofenceRadiusMeters
        : existing.geofenceRadiusMeters;
    this.validateCoordinates(nextLat, nextLng, nextGeofence ?? undefined);

    if (nextCustomerId) {
      await this.assertCustomerInTenant(tenantId, nextCustomerId);
      const activeLinks = await this.prisma.client.locationBranch.findMany({
        where: { tenantId, locationId: id, deletedAt: null },
        select: { branchId: true },
      });
      if (activeLinks.length > 0) {
        await this.assertBranchesCompatibleWithCustomer(
          tenantId,
          nextCustomerId,
          activeLinks.map((l) => l.branchId),
        );
      }
    }

    const location = await this.prisma.client.location.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        locationType: dto.locationType,
        customerId: dto.customerId !== undefined ? dto.customerId : undefined,
        addressLine1: dto.addressLine1?.trim(),
        addressLine2: dto.addressLine2?.trim(),
        district: dto.district?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim()?.toUpperCase(),
        country: dto.country?.trim()?.toUpperCase(),
        zipCode: dto.zipCode?.trim(),
        latitude: dto.latitude !== undefined ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined ? dto.longitude : undefined,
        timezone: dto.timezone?.trim(),
        geofenceRadiusMeters:
          dto.geofenceRadiusMeters !== undefined ? dto.geofenceRadiusMeters : undefined,
        contactName: dto.contactName?.trim(),
        contactRole: dto.contactRole?.trim(),
        email: dto.email?.trim().toLowerCase(),
        phone: dto.phone?.trim(),
        whatsapp: dto.whatsapp?.trim(),
        operatingHours: dto.operatingHours?.trim(),
        accessInstructions: dto.accessInstructions?.trim(),
        dockInfo: dto.dockInfo?.trim(),
        referencePoint: dto.referencePoint?.trim(),
        status: dto.status,
        notes: dto.notes?.trim(),
      },
      select: LOCATION_SELECT,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.LOCATION_UPDATED,
      entity: "Location",
      entityId: id,
      metadata: {
        locationId: id,
        locationCode: location.code,
        locationName: location.name,
        locationType: location.locationType,
        customerId: location.customerId,
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async disable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertLocationGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.location.update({
      where: { id },
      data: { status: "DISABLED", disabledAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.LOCATION_DISABLED,
      entity: "Location",
      entityId: id,
      metadata: {
        locationId: id,
        locationCode: existing.code,
        previousStatus: existing.status,
        newStatus: "DISABLED",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async enable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertLocationGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.location.update({
      where: { id },
      data: { status: "ACTIVE", disabledAt: null },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.LOCATION_ENABLED,
      entity: "Location",
      entityId: id,
      metadata: {
        locationId: id,
        locationCode: existing.code,
        previousStatus: existing.status,
        newStatus: "ACTIVE",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertLocationGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.location.update({
        where: { id },
        data: { status: "DISABLED", deletedAt: new Date(), disabledAt: new Date() },
      });
      await tx.locationBranch.updateMany({
        where: { tenantId, locationId: id, deletedAt: null },
        data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.LOCATION_DELETED,
      entity: "Location",
      entityId: id,
      metadata: {
        locationId: id,
        locationCode: existing.code,
        locationName: existing.name,
      },
      ...meta,
    });

    return { success: true };
  }

  async listBranches(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertLocationReadAccess(id, tenantId, actor);
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    return this.prisma.client.locationBranch.findMany({
      where: {
        tenantId,
        locationId: id,
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
    dto: AssignLocationBranchesDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertLocationBranchMutationAllowed(actor.permissions);
    const location = await this.getExisting(id, tenantId);
    const branchIds = [...new Set(dto.branchIds)];
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);

    if (location.customerId) {
      await this.assertBranchesCompatibleWithCustomer(tenantId, location.customerId, branchIds);
    }

    await this.prisma.client.$transaction(async (tx) => {
      for (const branchId of branchIds) {
        await tx.locationBranch.upsert({
          where: { tenantId_locationId_branchId: { tenantId, locationId: id, branchId } },
          update: { deletedAt: null, disabledAt: null, status: "ACTIVE" },
          create: { tenantId, locationId: id, branchId },
        });
      }
    });

    if (dto.primaryBranchId) {
      await this.setPrimaryBranch(id, tenantId, { branchId: dto.primaryBranchId }, actor, meta, false);
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.LOCATION_BRANCH_ASSIGNED,
      entity: "LocationBranch",
      entityId: id,
      metadata: {
        locationId: id,
        locationCode: location.code,
        branchIds,
        customerId: location.customerId,
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
    this.authorization.assertLocationBranchMutationAllowed(actor.permissions);
    const location = await this.getExisting(id, tenantId);

    const link = await this.prisma.client.locationBranch.findFirst({
      where: { tenantId, locationId: id, branchId: dto.branchId, deletedAt: null },
      select: { id: true },
    });
    if (!link) {
      throw new BadRequestException("Filial não está vinculada a este local.");
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.locationBranch.updateMany({
        where: { tenantId, locationId: id, deletedAt: null },
        data: { isPrimary: false },
      });
      await tx.locationBranch.update({
        where: { id: link.id },
        data: { isPrimary: true },
      });
    });

    if (audit) {
      await this.audit.log({
        tenantId,
        userId: actor.userId,
        action: AuditAction.LOCATION_PRIMARY_BRANCH_CHANGED,
        entity: "LocationBranch",
        entityId: link.id,
        metadata: {
          locationId: id,
          locationCode: location.code,
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
    this.authorization.assertLocationBranchMutationAllowed(actor.permissions);
    const location = await this.getExisting(id, tenantId);

    const activeCount = await this.prisma.client.locationBranch.count({
      where: { tenantId, locationId: id, deletedAt: null },
    });
    if (activeCount <= 1) {
      throw new BadRequestException("Não é possível remover a última filial ativa do local.");
    }

    const deleted = await this.prisma.client.locationBranch.updateMany({
      where: { tenantId, locationId: id, branchId, deletedAt: null },
      data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Vínculo local-filial não encontrado.");
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.LOCATION_BRANCH_REMOVED,
      entity: "LocationBranch",
      entityId: id,
      metadata: { locationId: id, locationCode: location.code, branchId },
      ...meta,
    });

    return this.listBranches(id, tenantId, actor);
  }

  private validateCoordinates(
    latitude?: number | null,
    longitude?: number | null,
    geofenceRadiusMeters?: number,
  ) {
    const hasLat = latitude != null;
    const hasLng = longitude != null;
    if (hasLat !== hasLng) {
      throw new BadRequestException("Informe latitude e longitude juntas.");
    }
    if (geofenceRadiusMeters != null && geofenceRadiusMeters <= 0) {
      throw new BadRequestException("Raio de geofence deve ser positivo.");
    }
  }

  private async buildListWhere(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListLocationsQueryDto,
  ): Promise<Prisma.LocationWhereInput> {
    const where: Prisma.LocationWhereInput = { tenantId, deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.locationType) where.locationType = query.locationType;
    if (query.customerId) where.customerId = query.customerId;
    if (query.city?.trim()) {
      where.city = { contains: query.city.trim(), mode: "insensitive" };
    }
    if (query.state?.trim()) {
      where.state = { equals: query.state.trim().toUpperCase(), mode: "insensitive" };
    }
    if (query.country?.trim()) {
      where.country = { equals: query.country.trim().toUpperCase(), mode: "insensitive" };
    }

    if (query.hasCoordinates === "true") {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { latitude: { not: null } },
        { longitude: { not: null } },
      ];
    } else if (query.hasCoordinates === "false") {
      where.OR = [{ latitude: null }, { longitude: null }];
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { state: { contains: term, mode: "insensitive" } },
        { zipCode: { contains: term, mode: "insensitive" } },
        { contactName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { customer: { legalName: { contains: term, mode: "insensitive" } } },
        { customer: { tradeName: { contains: term, mode: "insensitive" } } },
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
    if (this.authorization.hasGlobalLocationScope(actor.permissions)) {
      return null;
    }
    const rows = await this.prisma.client.userBranchAccess.findMany({
      where: { tenantId, userId: actor.userId },
      select: { branchId: true },
    });
    return rows.map((r) => r.branchId);
  }

  private async assertLocationReadAccess(
    locationId: string,
    tenantId: string,
    actor: AuthUserPayload,
  ) {
    const location = await this.getExisting(locationId, tenantId);
    this.authorization.assertSameTenant(location.tenantId, tenantId);

    if (this.authorization.hasGlobalLocationScope(actor.permissions)) {
      return location;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible || accessible.length === 0) {
      throw new ForbiddenException("Você não possui acesso a este local.");
    }

    const link = await this.prisma.client.locationBranch.findFirst({
      where: {
        tenantId,
        locationId,
        branchId: { in: accessible },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException("Você não possui acesso a este local.");
    }

    return location;
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

    if (this.authorization.hasGlobalLocationScope(actor.permissions)) {
      return;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    const missing = branchIds.filter((id) => !accessible?.includes(id));
    if (missing.length > 0) {
      throw new ForbiddenException("Você não possui acesso a uma ou mais filiais informadas.");
    }
  }

  private async assertCustomerInTenant(tenantId: string, customerId: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, tenantId, deletedAt: null },
      select: { id: true, code: true },
    });
    if (!customer) {
      throw new BadRequestException("Cliente inválido ou não pertence ao tenant.");
    }
    return customer;
  }

  private async assertBranchesCompatibleWithCustomer(
    tenantId: string,
    customerId: string,
    branchIds: string[],
  ) {
    const allowed = await this.prisma.client.customerBranch.findMany({
      where: { tenantId, customerId, deletedAt: null, status: "ACTIVE" },
      select: { branchId: true },
    });
    const allowedIds = new Set(allowed.map((a) => a.branchId));
    const invalid = branchIds.filter((id) => !allowedIds.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        "Uma ou mais filiais não atendem o cliente vinculado a este local.",
      );
    }
  }

  private async applyBranchVisibilityToLocation(
    location: LocationWithBranches,
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<LocationWithBranches> {
    if (this.authorization.hasGlobalLocationScope(actor.permissions)) {
      return location;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return location;
    }
    return {
      ...location,
      branches: location.branches.filter((link) => accessible.includes(link.branchId)),
    };
  }

  private async applyBranchVisibilityToLocations(
    locations: LocationWithBranches[],
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<LocationWithBranches[]> {
    if (this.authorization.hasGlobalLocationScope(actor.permissions)) {
      return locations;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return locations;
    }
    return locations.map((location) => ({
      ...location,
      branches: location.branches.filter((link) => accessible.includes(link.branchId)),
    }));
  }

  private async getExisting(id: string, tenantId: string) {
    const location = await this.prisma.client.location.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        code: true,
        name: true,
        locationType: true,
        customerId: true,
        status: true,
        latitude: true,
        longitude: true,
        geofenceRadiusMeters: true,
      },
    });
    if (!location) {
      throw new NotFoundException("Local não encontrado.");
    }
    this.authorization.assertSameTenant(location.tenantId, tenantId);
    return location;
  }

  private async assertUniqueCode(tenantId: string, code: string, excludeId?: string) {
    const existing = await this.prisma.client.location.findFirst({
      where: { tenantId, code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(CODE_CONFLICT_MESSAGE);
    }
  }
}
