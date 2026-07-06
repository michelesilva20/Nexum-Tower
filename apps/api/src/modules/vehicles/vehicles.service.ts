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
  AssignVehicleBranchesDto,
  CreateVehicleDto,
  ListVehiclesQueryDto,
  UpdateVehicleDto,
} from "./dto/vehicle.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const VEHICLE_SELECT = {
  id: true,
  tenantId: true,
  code: true,
  plate: true,
  fleetNumber: true,
  vehicleType: true,
  vehicleCategory: true,
  ownershipType: true,
  brand: true,
  model: true,
  version: true,
  manufactureYear: true,
  modelYear: true,
  color: true,
  renavam: true,
  chassisNumber: true,
  engineNumber: true,
  licensePlateState: true,
  licensePlateCountry: true,
  fuelType: true,
  emissionStandard: true,
  axleCount: true,
  tireCount: true,
  tareWeightKg: true,
  grossWeightKg: true,
  payloadCapacityKg: true,
  volumeCapacityM3: true,
  bodyType: true,
  bodyDescription: true,
  trackerProvider: true,
  trackerDeviceId: true,
  trackerImei: true,
  odometerKm: true,
  hourMeter: true,
  licensingExpiresAt: true,
  insuranceExpiresAt: true,
  inspectionExpiresAt: true,
  tachographExpiresAt: true,
  anttExpiresAt: true,
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

const SORT_WHITELIST: Record<string, keyof Prisma.VehicleOrderByWithRelationInput> = {
  code: "code",
  plate: "plate",
  fleetNumber: "fleetNumber",
  vehicleType: "vehicleType",
  vehicleCategory: "vehicleCategory",
  ownershipType: "ownershipType",
  brand: "brand",
  model: "model",
  status: "status",
  availabilityStatus: "availabilityStatus",
  licensingExpiresAt: "licensingExpiresAt",
  insuranceExpiresAt: "insuranceExpiresAt",
  inspectionExpiresAt: "inspectionExpiresAt",
  tachographExpiresAt: "tachographExpiresAt",
  anttExpiresAt: "anttExpiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

const CODE_CONFLICT_MESSAGE =
  "Não é possível reutilizar este código de veículo. Ele já foi usado neste tenant.";

const PLATE_CONFLICT_MESSAGE =
  "Já existe um veículo ativo com esta placa neste tenant.";

const RENAVAM_CONFLICT_MESSAGE =
  "Já existe um veículo ativo com este RENAVAM neste tenant.";

const CHASSIS_CONFLICT_MESSAGE =
  "Já existe um veículo ativo com este chassi neste tenant.";

const FLEET_NUMBER_CONFLICT_MESSAGE =
  "Já existe um veículo ativo com este número de frota neste tenant.";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Normaliza placa para armazenamento: uppercase, trim, remove espaços e hífens.
 * Ex.: "abc-1d23" e "ABC 1D23" → "ABC1D23"
 */
function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/[\s-]/g, "");
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

function toNumericValue(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
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

export type VehicleWithBranches = Prisma.VehicleGetPayload<{ select: typeof VEHICLE_SELECT }> & {
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
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListVehiclesQueryDto,
  ): Promise<PaginatedResult<VehicleWithBranches>> {
    const { page, perPage, skip, take } = resolvePagination({
      page: query.page,
      perPage: query.perPage ?? query.pageSize,
    });

    const where = await this.buildListWhere(tenantId, actor, query);
    const sortField =
      query.sortBy && SORT_WHITELIST[query.sortBy] ? SORT_WHITELIST[query.sortBy] : "plate";
    const sortDir = query.sortDirection === "desc" ? "desc" : "asc";

    const [items, total] = await Promise.all([
      this.prisma.client.vehicle.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take,
        select: {
          ...VEHICLE_SELECT,
          branches: {
            where: { deletedAt: null },
            select: BRANCH_LINK_SELECT,
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      }),
      this.prisma.client.vehicle.count({ where }),
    ]);

    return buildPaginatedResult(
      await this.applyBranchVisibilityToVehicles(items as VehicleWithBranches[], tenantId, actor),
      total,
      page,
      perPage,
    );
  }

  async getById(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertVehicleReadAccess(id, tenantId, actor);
    const vehicle = await this.prisma.client.vehicle.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...VEHICLE_SELECT,
        branches: {
          where: { deletedAt: null },
          select: BRANCH_LINK_SELECT,
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!vehicle) {
      throw new NotFoundException("Veículo não encontrado.");
    }
    return this.applyBranchVisibilityToVehicle(vehicle as VehicleWithBranches, tenantId, actor);
  }

  async create(
    tenantId: string,
    dto: CreateVehicleDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertVehicleGlobalMutationAllowed(actor.permissions);
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

    const plate = normalizePlate(dto.plate);
    const fleetNumber = dto.fleetNumber?.trim() || null;
    const renavam = dto.renavam?.trim() || null;
    const chassisNumber = dto.chassisNumber?.trim() || null;
    const status = dto.status ?? "ACTIVE";

    this.validateVehicleBusinessRules({
      axleCount: dto.axleCount,
      tireCount: dto.tireCount,
      tareWeightKg: dto.tareWeightKg,
      grossWeightKg: dto.grossWeightKg,
      payloadCapacityKg: dto.payloadCapacityKg,
      volumeCapacityM3: dto.volumeCapacityM3,
      odometerKm: dto.odometerKm,
      hourMeter: dto.hourMeter,
    });

    await this.assertUniquePlate(tenantId, plate);
    if (renavam) {
      await this.assertUniqueRenavam(tenantId, renavam);
    }
    if (chassisNumber) {
      await this.assertUniqueChassisNumber(tenantId, chassisNumber);
    }
    if (fleetNumber) {
      await this.assertUniqueFleetNumber(tenantId, fleetNumber);
    }

    const vehicle = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.vehicle.create({
        data: {
          tenantId,
          code,
          plate,
          fleetNumber,
          vehicleType: dto.vehicleType,
          vehicleCategory: dto.vehicleCategory,
          ownershipType: dto.ownershipType,
          brand: dto.brand.trim(),
          model: dto.model.trim(),
          version: dto.version?.trim(),
          manufactureYear: dto.manufactureYear,
          modelYear: dto.modelYear,
          color: dto.color?.trim(),
          renavam,
          chassisNumber,
          engineNumber: dto.engineNumber?.trim(),
          licensePlateState: dto.licensePlateState?.trim()?.toUpperCase(),
          licensePlateCountry: dto.licensePlateCountry?.trim()?.toUpperCase() ?? "BR",
          fuelType: dto.fuelType,
          emissionStandard: dto.emissionStandard?.trim(),
          axleCount: dto.axleCount,
          tireCount: dto.tireCount,
          tareWeightKg: toDecimalInput(dto.tareWeightKg),
          grossWeightKg: toDecimalInput(dto.grossWeightKg),
          payloadCapacityKg: toDecimalInput(dto.payloadCapacityKg),
          volumeCapacityM3: toDecimalInput(dto.volumeCapacityM3),
          bodyType: dto.bodyType,
          bodyDescription: dto.bodyDescription?.trim(),
          trackerProvider: dto.trackerProvider?.trim(),
          trackerDeviceId: dto.trackerDeviceId?.trim(),
          trackerImei: dto.trackerImei?.trim(),
          odometerKm: toDecimalInput(dto.odometerKm),
          hourMeter: toDecimalInput(dto.hourMeter),
          licensingExpiresAt: parseOptionalDate(dto.licensingExpiresAt) ?? null,
          insuranceExpiresAt: parseOptionalDate(dto.insuranceExpiresAt) ?? null,
          inspectionExpiresAt: parseOptionalDate(dto.inspectionExpiresAt) ?? null,
          tachographExpiresAt: parseOptionalDate(dto.tachographExpiresAt) ?? null,
          anttExpiresAt: parseOptionalDate(dto.anttExpiresAt) ?? null,
          availabilityStatus: dto.availabilityStatus ?? "AVAILABLE",
          status,
          notes: dto.notes?.trim(),
        },
        select: VEHICLE_SELECT,
      });

      for (const branchId of branchIds) {
        await tx.vehicleBranch.create({
          data: {
            tenantId,
            vehicleId: created.id,
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
      action: AuditAction.VEHICLE_CREATED,
      entity: "Vehicle",
      entityId: vehicle.id,
      metadata: {
        vehicleId: vehicle.id,
        vehicleCode: vehicle.code,
        vehiclePlate: vehicle.plate,
        fleetNumber: vehicle.fleetNumber,
        vehicleType: vehicle.vehicleType,
        vehicleCategory: vehicle.vehicleCategory,
        branchIds,
        primaryBranchId,
      },
      ...meta,
    });

    return this.getById(vehicle.id, tenantId, actor);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateVehicleDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertVehicleGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    const nextPlate = dto.plate !== undefined ? normalizePlate(dto.plate) : existing.plate;
    const nextFleetNumber =
      dto.fleetNumber !== undefined ? dto.fleetNumber?.trim() || null : existing.fleetNumber;
    const nextRenavam =
      dto.renavam !== undefined ? dto.renavam?.trim() || null : existing.renavam;
    const nextChassisNumber =
      dto.chassisNumber !== undefined ? dto.chassisNumber?.trim() || null : existing.chassisNumber;

    const nextAxleCount = dto.axleCount !== undefined ? dto.axleCount : existing.axleCount;
    const nextTireCount = dto.tireCount !== undefined ? dto.tireCount : existing.tireCount;
    const nextTareWeightKg =
      dto.tareWeightKg !== undefined ? dto.tareWeightKg : toNumericValue(existing.tareWeightKg);
    const nextGrossWeightKg =
      dto.grossWeightKg !== undefined ? dto.grossWeightKg : toNumericValue(existing.grossWeightKg);
    const nextPayloadCapacityKg =
      dto.payloadCapacityKg !== undefined
        ? dto.payloadCapacityKg
        : toNumericValue(existing.payloadCapacityKg);
    const nextVolumeCapacityM3 =
      dto.volumeCapacityM3 !== undefined
        ? dto.volumeCapacityM3
        : toNumericValue(existing.volumeCapacityM3);
    const nextOdometerKm =
      dto.odometerKm !== undefined ? dto.odometerKm : toNumericValue(existing.odometerKm);
    const nextHourMeter =
      dto.hourMeter !== undefined ? dto.hourMeter : toNumericValue(existing.hourMeter);

    this.validateVehicleBusinessRules({
      axleCount: nextAxleCount,
      tireCount: nextTireCount,
      tareWeightKg: nextTareWeightKg,
      grossWeightKg: nextGrossWeightKg,
      payloadCapacityKg: nextPayloadCapacityKg,
      volumeCapacityM3: nextVolumeCapacityM3,
      odometerKm: nextOdometerKm,
      hourMeter: nextHourMeter,
    });

    if (nextPlate !== existing.plate) {
      await this.assertUniquePlate(tenantId, nextPlate, id);
    }
    if (nextRenavam && nextRenavam !== existing.renavam) {
      await this.assertUniqueRenavam(tenantId, nextRenavam, id);
    }
    if (nextChassisNumber && nextChassisNumber !== existing.chassisNumber) {
      await this.assertUniqueChassisNumber(tenantId, nextChassisNumber, id);
    }
    if (nextFleetNumber && nextFleetNumber !== existing.fleetNumber) {
      await this.assertUniqueFleetNumber(tenantId, nextFleetNumber, id);
    }

    const vehicle = await this.prisma.client.vehicle.update({
      where: { id },
      data: {
        plate: dto.plate !== undefined ? nextPlate : undefined,
        fleetNumber: dto.fleetNumber !== undefined ? nextFleetNumber : undefined,
        vehicleType: dto.vehicleType,
        vehicleCategory: dto.vehicleCategory,
        ownershipType: dto.ownershipType,
        brand: dto.brand?.trim(),
        model: dto.model?.trim(),
        version: dto.version?.trim(),
        manufactureYear: dto.manufactureYear,
        modelYear: dto.modelYear,
        color: dto.color?.trim(),
        renavam: dto.renavam !== undefined ? nextRenavam : undefined,
        chassisNumber: dto.chassisNumber !== undefined ? nextChassisNumber : undefined,
        engineNumber: dto.engineNumber?.trim(),
        licensePlateState: dto.licensePlateState?.trim()?.toUpperCase(),
        licensePlateCountry: dto.licensePlateCountry?.trim()?.toUpperCase(),
        fuelType: dto.fuelType,
        emissionStandard: dto.emissionStandard?.trim(),
        axleCount: dto.axleCount !== undefined ? dto.axleCount : undefined,
        tireCount: dto.tireCount !== undefined ? dto.tireCount : undefined,
        tareWeightKg: dto.tareWeightKg !== undefined ? toDecimalInput(dto.tareWeightKg) : undefined,
        grossWeightKg:
          dto.grossWeightKg !== undefined ? toDecimalInput(dto.grossWeightKg) : undefined,
        payloadCapacityKg:
          dto.payloadCapacityKg !== undefined ? toDecimalInput(dto.payloadCapacityKg) : undefined,
        volumeCapacityM3:
          dto.volumeCapacityM3 !== undefined ? toDecimalInput(dto.volumeCapacityM3) : undefined,
        bodyType: dto.bodyType,
        bodyDescription: dto.bodyDescription?.trim(),
        trackerProvider: dto.trackerProvider?.trim(),
        trackerDeviceId: dto.trackerDeviceId?.trim(),
        trackerImei: dto.trackerImei?.trim(),
        odometerKm: dto.odometerKm !== undefined ? toDecimalInput(dto.odometerKm) : undefined,
        hourMeter: dto.hourMeter !== undefined ? toDecimalInput(dto.hourMeter) : undefined,
        licensingExpiresAt:
          dto.licensingExpiresAt !== undefined
            ? parseOptionalDate(dto.licensingExpiresAt) ?? null
            : undefined,
        insuranceExpiresAt:
          dto.insuranceExpiresAt !== undefined
            ? parseOptionalDate(dto.insuranceExpiresAt) ?? null
            : undefined,
        inspectionExpiresAt:
          dto.inspectionExpiresAt !== undefined
            ? parseOptionalDate(dto.inspectionExpiresAt) ?? null
            : undefined,
        tachographExpiresAt:
          dto.tachographExpiresAt !== undefined
            ? parseOptionalDate(dto.tachographExpiresAt) ?? null
            : undefined,
        anttExpiresAt:
          dto.anttExpiresAt !== undefined ? parseOptionalDate(dto.anttExpiresAt) ?? null : undefined,
        availabilityStatus: dto.availabilityStatus,
        status: dto.status,
        notes: dto.notes?.trim(),
      },
      select: VEHICLE_SELECT,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.VEHICLE_UPDATED,
      entity: "Vehicle",
      entityId: id,
      metadata: {
        vehicleId: id,
        vehicleCode: vehicle.code,
        vehiclePlate: vehicle.plate,
        fleetNumber: vehicle.fleetNumber,
        vehicleType: vehicle.vehicleType,
        vehicleCategory: vehicle.vehicleCategory,
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async disable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertVehicleGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.vehicle.update({
      where: { id },
      data: { status: "DISABLED", disabledAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.VEHICLE_DISABLED,
      entity: "Vehicle",
      entityId: id,
      metadata: {
        vehicleId: id,
        vehicleCode: existing.code,
        vehiclePlate: existing.plate,
        previousStatus: existing.status,
        newStatus: "DISABLED",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async enable(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertVehicleGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    this.validateVehicleBusinessRules({
      axleCount: existing.axleCount,
      tireCount: existing.tireCount,
      tareWeightKg: toNumericValue(existing.tareWeightKg),
      grossWeightKg: toNumericValue(existing.grossWeightKg),
      payloadCapacityKg: toNumericValue(existing.payloadCapacityKg),
      volumeCapacityM3: toNumericValue(existing.volumeCapacityM3),
      odometerKm: toNumericValue(existing.odometerKm),
      hourMeter: toNumericValue(existing.hourMeter),
    });

    await this.prisma.client.vehicle.update({
      where: { id },
      data: { status: "ACTIVE", disabledAt: null },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.VEHICLE_ENABLED,
      entity: "Vehicle",
      entityId: id,
      metadata: {
        vehicleId: id,
        vehicleCode: existing.code,
        vehiclePlate: existing.plate,
        previousStatus: existing.status,
        newStatus: "ACTIVE",
      },
      ...meta,
    });

    return this.getById(id, tenantId, actor);
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    this.authorization.assertVehicleGlobalMutationAllowed(actor.permissions);
    const existing = await this.getExisting(id, tenantId);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id },
        data: { status: "DISABLED", deletedAt: new Date(), disabledAt: new Date() },
      });
      await tx.vehicleBranch.updateMany({
        where: { tenantId, vehicleId: id, deletedAt: null },
        data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
      });
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.VEHICLE_DELETED,
      entity: "Vehicle",
      entityId: id,
      metadata: {
        vehicleId: id,
        vehicleCode: existing.code,
        vehiclePlate: existing.plate,
        fleetNumber: existing.fleetNumber,
      },
      ...meta,
    });

    return { success: true };
  }

  async listBranches(id: string, tenantId: string, actor: AuthUserPayload) {
    await this.assertVehicleReadAccess(id, tenantId, actor);
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    return this.prisma.client.vehicleBranch.findMany({
      where: {
        tenantId,
        vehicleId: id,
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
    dto: AssignVehicleBranchesDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    this.authorization.assertVehicleBranchMutationAllowed(actor.permissions);
    const vehicle = await this.getExisting(id, tenantId);
    const branchIds = [...new Set(dto.branchIds)];
    await this.assertBranchesForAssignment(tenantId, branchIds, actor);

    await this.prisma.client.$transaction(async (tx) => {
      for (const branchId of branchIds) {
        await tx.vehicleBranch.upsert({
          where: { tenantId_vehicleId_branchId: { tenantId, vehicleId: id, branchId } },
          update: { deletedAt: null, disabledAt: null, status: "ACTIVE" },
          create: { tenantId, vehicleId: id, branchId },
        });
      }
    });

    if (dto.primaryBranchId) {
      await this.setPrimaryBranch(id, tenantId, { branchId: dto.primaryBranchId }, actor, meta, false);
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.VEHICLE_BRANCH_ASSIGNED,
      entity: "VehicleBranch",
      entityId: id,
      metadata: {
        vehicleId: id,
        vehicleCode: vehicle.code,
        vehiclePlate: vehicle.plate,
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
    this.authorization.assertVehicleBranchMutationAllowed(actor.permissions);
    const vehicle = await this.getExisting(id, tenantId);

    const link = await this.prisma.client.vehicleBranch.findFirst({
      where: { tenantId, vehicleId: id, branchId: dto.branchId, deletedAt: null },
      select: { id: true },
    });
    if (!link) {
      throw new BadRequestException("Filial não está vinculada a este veículo.");
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.vehicleBranch.updateMany({
        where: { tenantId, vehicleId: id, deletedAt: null },
        data: { isPrimary: false },
      });
      await tx.vehicleBranch.update({
        where: { id: link.id },
        data: { isPrimary: true },
      });
    });

    if (audit) {
      await this.audit.log({
        tenantId,
        userId: actor.userId,
        action: AuditAction.VEHICLE_PRIMARY_BRANCH_CHANGED,
        entity: "VehicleBranch",
        entityId: link.id,
        metadata: {
          vehicleId: id,
          vehicleCode: vehicle.code,
          vehiclePlate: vehicle.plate,
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
    this.authorization.assertVehicleBranchMutationAllowed(actor.permissions);
    const vehicle = await this.getExisting(id, tenantId);

    const activeCount = await this.prisma.client.vehicleBranch.count({
      where: { tenantId, vehicleId: id, deletedAt: null },
    });
    if (activeCount <= 1) {
      throw new BadRequestException("Não é possível remover a última filial ativa do veículo.");
    }

    const deleted = await this.prisma.client.vehicleBranch.updateMany({
      where: { tenantId, vehicleId: id, branchId, deletedAt: null },
      data: { deletedAt: new Date(), disabledAt: new Date(), status: "DISABLED", isPrimary: false },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Vínculo veículo-filial não encontrado.");
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.VEHICLE_BRANCH_REMOVED,
      entity: "VehicleBranch",
      entityId: id,
      metadata: {
        vehicleId: id,
        vehicleCode: vehicle.code,
        vehiclePlate: vehicle.plate,
        branchId,
      },
      ...meta,
    });

    return this.listBranches(id, tenantId, actor);
  }

  private validateVehicleBusinessRules(params: {
    axleCount?: number | null;
    tireCount?: number | null;
    tareWeightKg?: number | null;
    grossWeightKg?: number | null;
    payloadCapacityKg?: number | null;
    volumeCapacityM3?: number | null;
    odometerKm?: number | null;
    hourMeter?: number | null;
  }) {
    const numericChecks: Array<[unknown, string]> = [
      [params.axleCount, "Quantidade de eixos"],
      [params.tireCount, "Quantidade de pneus"],
      [params.tareWeightKg, "Peso tara"],
      [params.grossWeightKg, "Peso bruto"],
      [params.payloadCapacityKg, "Capacidade de carga"],
      [params.volumeCapacityM3, "Capacidade volumétrica"],
      [params.odometerKm, "Odômetro"],
      [params.hourMeter, "Horímetro"],
    ];

    for (const [value, label] of numericChecks) {
      if (value == null) {
        continue;
      }
      const numeric = toNumericValue(value);
      if (numeric == null || numeric <= 0) {
        throw new BadRequestException(`${label} deve ser um número positivo.`);
      }
    }
  }

  private async buildListWhere(
    tenantId: string,
    actor: AuthUserPayload,
    query: ListVehiclesQueryDto,
  ): Promise<Prisma.VehicleWhereInput> {
    const where: Prisma.VehicleWhereInput = { tenantId, deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.availabilityStatus) where.availabilityStatus = query.availabilityStatus;
    if (query.vehicleType) where.vehicleType = query.vehicleType;
    if (query.vehicleCategory) where.vehicleCategory = query.vehicleCategory;
    if (query.ownershipType) where.ownershipType = query.ownershipType;
    if (query.fuelType) where.fuelType = query.fuelType;
    if (query.bodyType) where.bodyType = query.bodyType;

    if (query.brand?.trim()) {
      where.brand = { contains: query.brand.trim(), mode: "insensitive" };
    }
    if (query.model?.trim()) {
      where.model = { contains: query.model.trim(), mode: "insensitive" };
    }
    if (query.plate?.trim()) {
      where.plate = normalizePlate(query.plate);
    }
    if (query.fleetNumber?.trim()) {
      where.fleetNumber = { contains: query.fleetNumber.trim(), mode: "insensitive" };
    }
    if (query.licensePlateState?.trim()) {
      where.licensePlateState = {
        equals: query.licensePlateState.trim().toUpperCase(),
        mode: "insensitive",
      };
    }

    if (query.licensingExpiringUntil) {
      where.licensingExpiresAt = {
        lte: new Date(query.licensingExpiringUntil),
        not: null,
      };
    }
    if (query.insuranceExpiringUntil) {
      where.insuranceExpiresAt = {
        lte: new Date(query.insuranceExpiringUntil),
        not: null,
      };
    }
    if (query.inspectionExpiringUntil) {
      where.inspectionExpiresAt = {
        lte: new Date(query.inspectionExpiringUntil),
        not: null,
      };
    }
    if (query.tachographExpiringUntil) {
      where.tachographExpiresAt = {
        lte: new Date(query.tachographExpiringUntil),
        not: null,
      };
    }
    if (query.anttExpiringUntil) {
      where.anttExpiresAt = {
        lte: new Date(query.anttExpiringUntil),
        not: null,
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const normalizedPlateTerm = normalizePlate(term);
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { plate: { contains: normalizedPlateTerm, mode: "insensitive" } },
        { fleetNumber: { contains: term, mode: "insensitive" } },
        { brand: { contains: term, mode: "insensitive" } },
        { model: { contains: term, mode: "insensitive" } },
        { renavam: { contains: term, mode: "insensitive" } },
        { chassisNumber: { contains: term, mode: "insensitive" } },
        { trackerDeviceId: { contains: term, mode: "insensitive" } },
        { trackerImei: { contains: term, mode: "insensitive" } },
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
    if (this.authorization.hasGlobalVehicleScope(actor.permissions)) {
      return null;
    }
    const rows = await this.prisma.client.userBranchAccess.findMany({
      where: { tenantId, userId: actor.userId },
      select: { branchId: true },
    });
    return rows.map((r) => r.branchId);
  }

  private async assertVehicleReadAccess(vehicleId: string, tenantId: string, actor: AuthUserPayload) {
    const vehicle = await this.getExisting(vehicleId, tenantId);
    this.authorization.assertSameTenant(vehicle.tenantId, tenantId);

    if (this.authorization.hasGlobalVehicleScope(actor.permissions)) {
      return vehicle;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible || accessible.length === 0) {
      throw new ForbiddenException("Você não possui acesso a este veículo.");
    }

    const link = await this.prisma.client.vehicleBranch.findFirst({
      where: {
        tenantId,
        vehicleId,
        branchId: { in: accessible },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException("Você não possui acesso a este veículo.");
    }

    return vehicle;
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

    if (this.authorization.hasGlobalVehicleScope(actor.permissions)) {
      return;
    }

    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    const missing = branchIds.filter((id) => !accessible?.includes(id));
    if (missing.length > 0) {
      throw new ForbiddenException("Você não possui acesso a uma ou mais filiais informadas.");
    }
  }

  private async applyBranchVisibilityToVehicle(
    vehicle: VehicleWithBranches,
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<VehicleWithBranches> {
    if (this.authorization.hasGlobalVehicleScope(actor.permissions)) {
      return vehicle;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return vehicle;
    }
    return {
      ...vehicle,
      branches: vehicle.branches.filter((link) => accessible.includes(link.branchId)),
    };
  }

  private async applyBranchVisibilityToVehicles(
    vehicles: VehicleWithBranches[],
    tenantId: string,
    actor: AuthUserPayload,
  ): Promise<VehicleWithBranches[]> {
    if (this.authorization.hasGlobalVehicleScope(actor.permissions)) {
      return vehicles;
    }
    const accessible = await this.getAccessibleBranchIds(tenantId, actor);
    if (!accessible) {
      return vehicles;
    }
    return vehicles.map((vehicle) => ({
      ...vehicle,
      branches: vehicle.branches.filter((link) => accessible.includes(link.branchId)),
    }));
  }

  private async getExisting(id: string, tenantId: string) {
    const vehicle = await this.prisma.client.vehicle.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        code: true,
        plate: true,
        fleetNumber: true,
        vehicleType: true,
        vehicleCategory: true,
        status: true,
        renavam: true,
        chassisNumber: true,
        axleCount: true,
        tireCount: true,
        tareWeightKg: true,
        grossWeightKg: true,
        payloadCapacityKg: true,
        volumeCapacityM3: true,
        odometerKm: true,
        hourMeter: true,
      },
    });
    if (!vehicle) {
      throw new NotFoundException("Veículo não encontrado.");
    }
    this.authorization.assertSameTenant(vehicle.tenantId, tenantId);
    return vehicle;
  }

  private async assertUniqueCode(tenantId: string, code: string, excludeId?: string) {
    const existing = await this.prisma.client.vehicle.findFirst({
      where: { tenantId, code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(CODE_CONFLICT_MESSAGE);
    }
  }

  private async assertUniquePlate(tenantId: string, plate: string, excludeId?: string) {
    const existing = await this.prisma.client.vehicle.findFirst({
      where: {
        tenantId,
        plate,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(PLATE_CONFLICT_MESSAGE);
    }
  }

  private async assertUniqueRenavam(tenantId: string, renavam: string, excludeId?: string) {
    const existing = await this.prisma.client.vehicle.findFirst({
      where: {
        tenantId,
        renavam,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(RENAVAM_CONFLICT_MESSAGE);
    }
  }

  private async assertUniqueChassisNumber(
    tenantId: string,
    chassisNumber: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.client.vehicle.findFirst({
      where: {
        tenantId,
        chassisNumber,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(CHASSIS_CONFLICT_MESSAGE);
    }
  }

  private async assertUniqueFleetNumber(tenantId: string, fleetNumber: string, excludeId?: string) {
    const existing = await this.prisma.client.vehicle.findFirst({
      where: {
        tenantId,
        fleetNumber,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(FLEET_NUMBER_CONFLICT_MESSAGE);
    }
  }
}
