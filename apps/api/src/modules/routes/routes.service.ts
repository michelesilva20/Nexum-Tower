import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
  AssignRouteBranchesDto,
  CreateRouteDto,
  ListRoutesQueryDto,
  ReplaceRoutePointsDto,
  RoutePointInputDto,
  UpdateRouteDto,
} from "./dto/route.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const LOCATION_SUMMARY_SELECT = {
  id: true,
  code: true,
  name: true,
  city: true,
  state: true,
} as const;

const ROUTE_SELECT = {
  id: true,
  tenantId: true,
  code: true,
  name: true,
  description: true,
  routeType: true,
  operationType: true,
  customerId: true,
  originLocationId: true,
  destinationLocationId: true,
  plannedDistanceKm: true,
  plannedDurationMinutes: true,
  estimatedTollCost: true,
  estimatedFuelCost: true,
  estimatedTotalCost: true,
  requiresMopp: true,
  requiresRefrigeration: true,
  requiresTracking: true,
  requiresEscort: true,
  riskLevel: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  disabledAt: true,
  deletedAt: true,
  customer: {
    select: { id: true, code: true, legalName: true, tradeName: true },
  },
  originLocation: { select: LOCATION_SUMMARY_SELECT },
  destinationLocation: { select: LOCATION_SUMMARY_SELECT },
} as const;

const BRANCH_LINK_SELECT = {
  id: true,
  branchId: true,
  isPrimary: true,
  status: true,
  updatedAt: true,
  branch: { select: { id: true, code: true, name: true, status: true } },
} as const;

const POINT_SELECT = {
  id: true,
  locationId: true,
  sequence: true,
  pointType: true,
  operationRole: true,
  plannedArrivalOffsetMinutes: true,
  plannedDepartureOffsetMinutes: true,
  plannedServiceTimeMinutes: true,
  distanceFromPreviousKm: true,
  durationFromPreviousMinutes: true,
  instructions: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  location: { select: LOCATION_SUMMARY_SELECT },
} as const;

const SORT_WHITELIST: Record<string, keyof Prisma.RouteOrderByWithRelationInput> = {
  code: "code",
  name: "name",
  routeType: "routeType",
  operationType: "operationType",
  riskLevel: "riskLevel",
  status: "status",
  plannedDistanceKm: "plannedDistanceKm",
  plannedDurationMinutes: "plannedDurationMinutes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

const CODE_CONFLICT_MESSAGE =
  "Não é possível reutilizar este código de rota. Ele já foi usado neste tenant.";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function toDecimalInput(value?: number | null): Prisma.Decimal | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Prisma.Decimal(value);
}

export type RouteWithRelations = Prisma.RouteGetPayload<{ select: typeof ROUTE_SELECT }> & {
  branches: Array<{
    id: string;
    branchId: string;
    isPrimary: boolean;
    status: string;
    updatedAt: Date;
    branch: { id: string; code: string; name: string; status: string };
  }>;
  pointCount: number;
};

export type RouteDetail = RouteWithRelations & {
  points: Array<Prisma.RoutePointGetPayload<{ select: typeof POINT_SELECT }>>;
};

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListRoutesQueryDto,
  ): Promise<PaginatedResult<RouteWithRelations>> {
    const { page, perPage, skip, take } = resolvePagination({
      page: query.page,
      perPage: query.perPage ?? query.pageSize,
    });

    const where = await this.buildListWhere(tenantId, actor, query);
    const sortField =
      query.sortBy && SORT_WHITELIST[query.sortBy] ? SORT_WHITELIST[query.sortBy] : "name";
    const sortDir = query.sortDirection === "desc" ? "desc" : "asc";

    const [items, total] = await Promise.all([
      this.prisma.client.route.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take,
        select: {
          ...ROUTE_SELECT,
          branches: {
            where: { deletedAt: null },
            select: BRANCH_LINK_SELECT,
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
          _count: {
            select: { points: { where: { deletedAt: null } } },
          },
        },
      }),
      this.prisma.client.route.count({ where }),
    ]);

    const mapped = items.map((item) => ({
      ...item,
      pointCount: item._count.points,
      _count: undefined,
    })) as RouteWithRelations[];

    return buildPaginatedResult(
      await this.applyBranchVisibilityToRoutes(mapped, tenantId, actor),
      total,
      page,
      perPage,
    );
  }

  async getById(id: string, tenantId: string, actor: AuthUserPayload): Promise<RouteDetail> {
    await this.assertRouteReadAccess(id, tenantId, actor);
    const route = await this.prisma.client.route.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...ROUTE_SELECT,
        branches: {
          where: { deletedAt: null },
          select: BRANCH_LINK_SELECT,
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        points: {
          where: { deletedAt: null },
          select: POINT_SELECT,
          orderBy: { sequence: "asc" },
        },
        _count: {
          select: { points: { where: { deletedAt: null } } },
        },
      },
    });
    if (!route) {
      throw new NotFoundException("Rota não encontrada.");
    }

    const { _count, ...rest } = route;
    const detail: RouteDetail = {
      ...(rest as Omit<typeof rest, "_count">),
      pointCount: _count.points,
      points: rest.points,
    };

    return this.applyBranchVisibilityToRoute(detail, tenantId, actor);
  }

  async create(tenantId: string, dto: CreateRouteDto, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertRouteGlobalMutationAllowed(actor.permissions);
    const code = normalizeCode(dto.code);
    await this.assertUniqueCode(tenantId, code);
    this.validateRouteNumericFields(dto);

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

    this.validatePoints(dto.points);
    await this.assertPointLocationsCompatibleWithRouteBranches(tenantId, branchIds, dto.points);
    const { originLocationId, destinationLocationId } = this.extractOriginDestination(dto.points);

    const route = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.route.create({
        data: {
          tenantId,
          code,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          routeType: dto.routeType,
          operationType: dto.operationType,
          customerId: dto.customerId ?? null,
          originLocationId,
          destinationLocationId,
          plannedDistanceKm: toDecimalInput(dto.plannedDistanceKm),
          plannedDurationMinutes: dto.plannedDurationMinutes ?? null,
          estimatedTollCost: toDecimalInput(dto.estimatedTollCost),
          estimatedFuelCost: toDecimalInput(dto.estimatedFuelCost),
          estimatedTotalCost: toDecimalInput(dto.estimatedTotalCost),
          requiresMopp: dto.requiresMopp ?? false,
          requiresRefrigeration: dto.requiresRefrigeration ?? false,
          requiresTracking: dto.requiresTracking ?? false,
          requiresEscort: dto.requiresEscort ?? false,
          riskLevel: dto.riskLevel ?? "LOW",
          status: dto.status ?? "ACTIVE",
          notes: dto.notes?.trim(),
        },
        select: ROUTE_SELECT,
      });

      for (const branchId of branchIds) {
        await tx.routeBranch.create({
          data: {
            tenantId,
            routeId: created.id,
            branchId,
            isPrimary: branchId === primaryBranchId,
          },
        });
      }

      await this.createPointsInTransaction(tx, tenantId, created.id, dto.points);

      return created;
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_CREATED,
      entity: "Route",
      entityId: route.id,
      metadata: {
        routeId: route.id,
        routeCode: route.code,
        routeName: route.name,
        routeType: route.routeType,
        operationType: route.operationType,
        customerId: route.customerId,
        originLocationId,
        destinationLocationId,
        branchIds,
        primaryBranchId,
        pointCount: dto.points.length,
      },
      ...meta,
    });

    return this.getById(route.id, tenantId, actor);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateRouteDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertRouteGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    const nextCustomerId =
      dto.customerId !== undefined ? dto.customerId : existing.customerId;

    if (nextCustomerId) {
      await this.assertCustomerInTenant(tenantId, nextCustomerId);
      const activeLinks = await this.prisma.client.routeBranch.findMany({
        where: { tenantId, routeId: id, deletedAt: null },
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

    this.validateRouteNumericFields({
      plannedDistanceKm: dto.plannedDistanceKm ?? undefined,
      plannedDurationMinutes: dto.plannedDurationMinutes ?? undefined,
      estimatedTollCost: dto.estimatedTollCost ?? undefined,
      estimatedFuelCost: dto.estimatedFuelCost ?? undefined,
      estimatedTotalCost: dto.estimatedTotalCost ?? undefined,
    });

    const route = await this.prisma.client.route.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description !== undefined ? dto.description?.trim() ?? null : undefined,
        routeType: dto.routeType,
        operationType: dto.operationType,
        customerId: dto.customerId !== undefined ? dto.customerId : undefined,
        plannedDistanceKm:
          dto.plannedDistanceKm !== undefined ? toDecimalInput(dto.plannedDistanceKm) : undefined,
        plannedDurationMinutes:
          dto.plannedDurationMinutes !== undefined ? dto.plannedDurationMinutes : undefined,
        estimatedTollCost:
          dto.estimatedTollCost !== undefined ? toDecimalInput(dto.estimatedTollCost) : undefined,
        estimatedFuelCost:
          dto.estimatedFuelCost !== undefined ? toDecimalInput(dto.estimatedFuelCost) : undefined,
        estimatedTotalCost:
          dto.estimatedTotalCost !== undefined
            ? toDecimalInput(dto.estimatedTotalCost)
            : undefined,
        requiresMopp: dto.requiresMopp,
        requiresRefrigeration: dto.requiresRefrigeration,
        requiresTracking: dto.requiresTracking,
        requiresEscort: dto.requiresEscort,
        riskLevel: dto.riskLevel,
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes?.trim() ?? null : undefined,
      },
      select: ROUTE_SELECT,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_UPDATED,
      entity: "Route",
      entityId: id,
      metadata: {
        routeId: id,
        routeCode: route.code,
        routeName: route.name,
        routeType: route.routeType,
        operationType: route.operationType,
        customerId: route.customerId,
        originLocationId: route.originLocationId,
        destinationLocationId: route.destinationLocationId,
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async disable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertRouteGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.route.update({
      where: { id },
      data: { status: "DISABLED", disabledAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_DISABLED,
      entity: "Route",
      entityId: id,
      metadata: {
        routeId: id,
        routeCode: existing.code,
        routeName: existing.name,
        previousStatus: existing.status,
        newStatus: "DISABLED",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async enable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertRouteGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.route.update({
      where: { id },
      data: { status: "ACTIVE", disabledAt: null },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_ENABLED,
      entity: "Route",
      entityId: id,
      metadata: {
        routeId: id,
        routeCode: existing.code,
        routeName: existing.name,
        previousStatus: existing.status,
        newStatus: "ACTIVE",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertRouteGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.route.update({
        where: { id },
        data: { status: "DISABLED", deletedAt: new Date(), disabledAt: new Date() },
      });
      await tx.routeBranch.updateMany({
        where: { tenantId, routeId: id, deletedAt: null },
        data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
      });
      await tx.routePoint.updateMany({
        where: { tenantId, routeId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_DELETED,
      entity: "Route",
      entityId: id,
      metadata: {
        routeId: id,
        routeCode: existing.code,
        routeName: existing.name,
        routeType: existing.routeType,
        operationType: existing.operationType,
        customerId: existing.customerId,
      },
      ...meta,
    });

    return { success: true };
  }

  async listBranches(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertRouteReadAccess(id, tenantId, actor);
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    return this.prisma.client.routeBranch.findMany({
      where: {
        tenantId,
        routeId: id,
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
    dto: AssignRouteBranchesDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertRouteBranchMutationAllowed(actor.permissions);
    const route = await this.getExisting(id, tenantId);
    const branchIds = [...new Set(dto.branchIds)];
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);

    if (route.customerId) {
      await this.assertBranchesCompatibleWithCustomer(tenantId, route.customerId, branchIds);
    }

    await this.prisma.client.$transaction(async (tx) => {
      for (const branchId of branchIds) {
        await tx.routeBranch.upsert({
          where: { tenantId_routeId_branchId: { tenantId, routeId: id, branchId } },
          update: { deletedAt: null, disabledAt: null, status: "ACTIVE" },
          create: { tenantId, routeId: id, branchId },
        });
      }
    });

    if (dto.primaryBranchId) {
      await this.setPrimaryBranch(id, tenantId, { branchId: dto.primaryBranchId }, actor, meta, false);
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_BRANCH_ASSIGNED,
      entity: "RouteBranch",
      entityId: id,
      metadata: {
        routeId: id,
        routeCode: route.code,
        routeName: route.name,
        branchIds,
        customerId: route.customerId,
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
    this.authorization.assertRouteBranchMutationAllowed(actor.permissions);
    const route = await this.getExisting(id, tenantId);

    const link = await this.prisma.client.routeBranch.findFirst({
      where: { tenantId, routeId: id, branchId: dto.branchId, deletedAt: null },
      select: { id: true },
    });
    if (!link) {
      throw new BadRequestException("Filial não está vinculada a esta rota.");
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.routeBranch.updateMany({
        where: { tenantId, routeId: id, deletedAt: null },
        data: { isPrimary: false },
      });
      await tx.routeBranch.update({
        where: { id: link.id },
        data: { isPrimary: true },
      });
    });

    if (audit) {
      await this.audit.log({
        tenantId,
        userId: actor.userId,
        action: AuditAction.ROUTE_PRIMARY_BRANCH_CHANGED,
        entity: "RouteBranch",
        entityId: link.id,
        metadata: {
          routeId: id,
          routeCode: route.code,
          routeName: route.name,
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
    this.authorization.assertRouteBranchMutationAllowed(actor.permissions);
    const route = await this.getExisting(id, tenantId);

    const activeCount = await this.prisma.client.routeBranch.count({
      where: { tenantId, routeId: id, deletedAt: null },
    });
    if (activeCount <= 1) {
      throw new BadRequestException("Não é possível remover a última filial ativa da rota.");
    }

    const deleted = await this.prisma.client.routeBranch.updateMany({
      where: { tenantId, routeId: id, branchId, deletedAt: null },
      data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Vínculo rota-filial não encontrado.");
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_BRANCH_REMOVED,
      entity: "RouteBranch",
      entityId: id,
      metadata: {
        routeId: id,
        routeCode: route.code,
        routeName: route.name,
        branchId,
      },
      ...meta,
    });

    return this.listBranches(id, tenantId, actor);
  }

  async listPoints(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertRouteReadAccess(id, tenantId, actor);
    return this.prisma.client.routePoint.findMany({
      where: { tenantId, routeId: id, deletedAt: null },
      select: POINT_SELECT,
      orderBy: { sequence: "asc" },
    });
  }

  async replacePoints(
    id: string,
    tenantId: string,
    dto: ReplaceRoutePointsDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertRoutePointsMutationAllowed(actor.permissions);
    const route = await this.getExisting(id, tenantId);

    const activeBranchLinks = await this.prisma.client.routeBranch.findMany({
      where: { tenantId, routeId: id, deletedAt: null },
      select: { branchId: true },
    });
    const routeBranchIds = activeBranchLinks.map((l) => l.branchId);
    if (routeBranchIds.length === 0) {
      throw new BadRequestException("Rota sem filiais ativas não pode receber pontos.");
    }

    this.validatePoints(dto.points);
    await this.assertPointLocationsCompatibleWithRouteBranches(tenantId, routeBranchIds, dto.points);
    const { originLocationId, destinationLocationId } = this.extractOriginDestination(dto.points);

    const previousPointCount = await this.prisma.client.routePoint.count({
      where: { tenantId, routeId: id, deletedAt: null },
    });

    await this.prisma.client.$transaction(async (tx) => {
      await tx.routePoint.deleteMany({ where: { tenantId, routeId: id } });
      await this.createPointsInTransaction(tx, tenantId, id, dto.points);
      await tx.route.update({
        where: { id },
        data: { originLocationId, destinationLocationId },
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROUTE_POINTS_UPDATED,
      entity: "RoutePoint",
      entityId: id,
      metadata: {
        routeId: id,
        routeCode: route.code,
        routeName: route.name,
        routeType: route.routeType,
        operationType: route.operationType,
        customerId: route.customerId,
        originLocationId,
        destinationLocationId,
        previousPointCount,
        newPointCount: dto.points.length,
      },
      ...meta,
    });

    return this.listPoints(id, tenantId, actor);
  }

  validatePoints(points: RoutePointInputDto[]) {
    if (points.length < 2) {
      throw new BadRequestException("A rota deve ter ao menos 2 pontos.");
    }

    const sorted = [...points].sort((a, b) => a.sequence - b.sequence);
    const sequences = sorted.map((p) => p.sequence);
    if (new Set(sequences).size !== sequences.length) {
      throw new BadRequestException("Sequência dos pontos deve ser única.");
    }

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].sequence !== i + 1) {
        throw new BadRequestException(
          "Sequência dos pontos deve iniciar em 1 e ser consecutiva.",
        );
      }
    }

    if (sorted[0].pointType !== "ORIGIN") {
      throw new BadRequestException("O primeiro ponto deve ser do tipo ORIGIN.");
    }

    if (sorted[sorted.length - 1].pointType !== "DESTINATION") {
      throw new BadRequestException("O último ponto deve ser do tipo DESTINATION.");
    }

    for (const point of points) {
      this.validatePointNumericFields(point);
    }
  }

  extractOriginDestination(points: RoutePointInputDto[]) {
    const sorted = [...points].sort((a, b) => a.sequence - b.sequence);
    return {
      originLocationId: sorted[0].locationId,
      destinationLocationId: sorted[sorted.length - 1].locationId,
    };
  }

  private validateRouteNumericFields(params: {
    plannedDistanceKm?: number | null;
    plannedDurationMinutes?: number | null;
    estimatedTollCost?: number | null;
    estimatedFuelCost?: number | null;
    estimatedTotalCost?: number | null;
  }) {
    const checks: Array<[unknown, string]> = [
      [params.plannedDistanceKm, "Distância planejada"],
      [params.plannedDurationMinutes, "Duração planejada"],
      [params.estimatedTollCost, "Custo estimado de pedágio"],
      [params.estimatedFuelCost, "Custo estimado de combustível"],
      [params.estimatedTotalCost, "Custo total estimado"],
    ];

    for (const [value, label] of checks) {
      if (value == null) {
        continue;
      }
      if (typeof value === "number" && value <= 0) {
        throw new BadRequestException(`${label} deve ser um número positivo.`);
      }
    }
  }

  private validatePointNumericFields(point: RoutePointInputDto) {
    const checks: Array<[unknown, string]> = [
      [point.distanceFromPreviousKm, "Distância desde o ponto anterior"],
      [point.durationFromPreviousMinutes, "Duração desde o ponto anterior"],
      [point.plannedServiceTimeMinutes, "Tempo de serviço planejado"],
    ];

    for (const [value, label] of checks) {
      if (value == null) {
        continue;
      }
      if (typeof value === "number" && value <= 0) {
        throw new BadRequestException(`${label} deve ser um número positivo.`);
      }
    }
  }

  private async createPointsInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    routeId: string,
    points: RoutePointInputDto[],
  ) {
    const sorted = [...points].sort((a, b) => a.sequence - b.sequence);
    for (const point of sorted) {
      await tx.routePoint.create({
        data: {
          tenantId,
          routeId,
          locationId: point.locationId,
          sequence: point.sequence,
          pointType: point.pointType,
          operationRole: point.operationRole,
          plannedArrivalOffsetMinutes: point.plannedArrivalOffsetMinutes ?? null,
          plannedDepartureOffsetMinutes: point.plannedDepartureOffsetMinutes ?? null,
          plannedServiceTimeMinutes: point.plannedServiceTimeMinutes ?? null,
          distanceFromPreviousKm: toDecimalInput(point.distanceFromPreviousKm),
          durationFromPreviousMinutes: point.durationFromPreviousMinutes ?? null,
          instructions: point.instructions?.trim(),
          notes: point.notes?.trim(),
        },
      });
    }
  }

  private async assertPointLocationsCompatibleWithRouteBranches(
    tenantId: string,
    routeBranchIds: string[],
    points: RoutePointInputDto[],
  ) {
    const locationIds = [...new Set(points.map((p) => p.locationId))];

    const locations = await this.prisma.client.location.findMany({
      where: { tenantId, id: { in: locationIds }, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (locations.length !== locationIds.length) {
      throw new BadRequestException("Um ou mais locais dos pontos são inválidos ou inativos.");
    }

    const locationBranches = await this.prisma.client.locationBranch.findMany({
      where: {
        tenantId,
        locationId: { in: locationIds },
        deletedAt: null,
        status: "ACTIVE",
      },
      select: { locationId: true, branchId: true },
    });

    const branchesByLocation = new Map<string, Set<string>>();
    for (const link of locationBranches) {
      if (!branchesByLocation.has(link.locationId)) {
        branchesByLocation.set(link.locationId, new Set());
      }
      branchesByLocation.get(link.locationId)!.add(link.branchId);
    }

    const routeBranchSet = new Set(routeBranchIds);

    for (const point of points) {
      const locationBranchIds = branchesByLocation.get(point.locationId);
      if (!locationBranchIds || locationBranchIds.size === 0) {
        throw new BadRequestException(
          `Local do ponto ${point.sequence} não possui filiais ativas vinculadas.`,
        );
      }
      const hasIntersection = [...locationBranchIds].some((branchId) =>
        routeBranchSet.has(branchId),
      );
      if (!hasIntersection) {
        throw new BadRequestException(
          `Local do ponto ${point.sequence} não possui filial em comum com a rota.`,
        );
      }
    }
  }

  private async buildListWhere(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListRoutesQueryDto,
  ): Promise<Prisma.RouteWhereInput> {
    const where: Prisma.RouteWhereInput = { tenantId, deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.routeType) where.routeType = query.routeType;
    if (query.operationType) where.operationType = query.operationType;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.customerId) where.customerId = query.customerId;
    if (query.originLocationId) where.originLocationId = query.originLocationId;
    if (query.destinationLocationId) where.destinationLocationId = query.destinationLocationId;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { customer: { legalName: { contains: term, mode: "insensitive" } } },
        { customer: { tradeName: { contains: term, mode: "insensitive" } } },
        { originLocation: { name: { contains: term, mode: "insensitive" } } },
        { originLocation: { code: { contains: term, mode: "insensitive" } } },
        { destinationLocation: { name: { contains: term, mode: "insensitive" } } },
        { destinationLocation: { code: { contains: term, mode: "insensitive" } } },
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
    if (this.authorization.hasGlobalRouteScope(actor.permissions)) {
      return null;
    }
    const rows = await this.prisma.client.userBranchAccess.findMany({
      where: { tenantId, userId: actor.userId },
      select: { branchId: true },
    });
    return rows.map((r) => r.branchId);
  }

  private async assertRouteReadAccess(routeId: string, tenantId: string, actor: AuthUserPayload) {
    const route = await this.getExisting(routeId, tenantId);
    this.authorization.assertSameTenant(route.tenantId, tenantId);

    if (this.authorization.hasGlobalRouteScope(actor.permissions)) {
      return route;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible || accessible.length === 0) {
      throw new ForbiddenException("Você não possui acesso a esta rota.");
    }

    const link = await this.prisma.client.routeBranch.findFirst({
      where: {
        tenantId,
        routeId,
        branchId: { in: accessible },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException("Você não possui acesso a esta rota.");
    }

    return route;
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

    if (this.authorization.hasGlobalRouteScope(actor.permissions)) {
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
        "Uma ou mais filiais não atendem o cliente vinculado a esta rota.",
      );
    }
  }

  private async applyBranchVisibilityToRoute(
    route: RouteDetail,
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<RouteDetail> {
    if (this.authorization.hasGlobalRouteScope(actor.permissions)) {
      return route;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return route;
    }
    return {
      ...route,
      branches: route.branches.filter((link) => accessible.includes(link.branchId)),
    };
  }

  private async applyBranchVisibilityToRoutes(
    routes: RouteWithRelations[],
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<RouteWithRelations[]> {
    if (this.authorization.hasGlobalRouteScope(actor.permissions)) {
      return routes;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return routes;
    }
    return routes.map((route) => ({
      ...route,
      branches: route.branches.filter((link) => accessible.includes(link.branchId)),
    }));
  }

  private async getExisting(id: string, tenantId: string) {
    const route = await this.prisma.client.route.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        code: true,
        name: true,
        routeType: true,
        operationType: true,
        customerId: true,
        originLocationId: true,
        destinationLocationId: true,
        status: true,
      },
    });
    if (!route) {
      throw new NotFoundException("Rota não encontrada.");
    }
    this.authorization.assertSameTenant(route.tenantId, tenantId);
    return route;
  }

  private async assertUniqueCode(tenantId: string, code: string, excludeId?: string) {
    const existing = await this.prisma.client.route.findFirst({
      where: { tenantId, code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(CODE_CONFLICT_MESSAGE);
    }
  }
}
