import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SettingDefinition } from "@prisma/client";
import { permissionMatches } from "@nexum-tower/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../../common/audit-actions";
import type { AuthUserPayload } from "../auth/types/auth-user.type";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const SENSITIVE_PERMISSION = "settings.security.update";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string) {
    const [definitions, tenantSettings] = await Promise.all([
      this.prisma.client.settingDefinition.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] }),
      this.prisma.client.tenantSetting.findMany({ where: { tenantId } }),
    ]);

    const byDefinition = new Map(tenantSettings.map((s) => [s.definitionId, s]));
    return definitions.map((def) => this.mergeDefinition(def, byDefinition.get(def.id)?.value));
  }

  async listModules() {
    const grouped = await this.prisma.client.settingDefinition.groupBy({
      by: ["module"],
      _count: { _all: true },
      orderBy: { module: "asc" },
    });
    return grouped.map((g) => ({ module: g.module, count: g._count._all }));
  }

  async getByKey(tenantId: string, key: string) {
    const def = await this.getDefinition(key);
    const tenantSetting = await this.prisma.client.tenantSetting.findFirst({
      where: { tenantId, definitionId: def.id },
    });
    return this.mergeDefinition(def, tenantSetting?.value);
  }

  async update(tenantId: string, key: string, value: unknown, actor: AuthUserPayload, meta: RequestMeta) {
    const def = await this.getDefinition(key);

    if (def.isSensitive && !permissionMatches(actor.permissions, SENSITIVE_PERMISSION)) {
      throw new ForbiddenException("Este parâmetro exige a permissão settings.security.update.");
    }

    this.validateValue(def, value);

    const current = await this.prisma.client.tenantSetting.findFirst({
      where: { tenantId, definitionId: def.id },
    });
    const oldValue = current?.value ?? def.defaultValue ?? null;

    await this.prisma.client.tenantSetting.upsert({
      where: { tenantId_definitionId: { tenantId, definitionId: def.id } },
      update: { value: value as Prisma.InputJsonValue },
      create: { tenantId, definitionId: def.id, value: value as Prisma.InputJsonValue },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.SETTING_UPDATED,
      entity: "TenantSetting",
      entityId: def.key,
      metadata: {
        key: def.key,
        module: def.module,
        oldValue: oldValue as Prisma.InputJsonValue,
        newValue: value as Prisma.InputJsonValue,
      },
      ...meta,
    });

    return this.mergeDefinition(def, value as Prisma.JsonValue);
  }

  private async getDefinition(key: string): Promise<SettingDefinition> {
    const def = await this.prisma.client.settingDefinition.findUnique({ where: { key } });
    if (!def) {
      throw new NotFoundException("Parâmetro não encontrado.");
    }
    return def;
  }

  private mergeDefinition(def: SettingDefinition, tenantValue: Prisma.JsonValue | undefined) {
    return {
      key: def.key,
      module: def.module,
      label: def.label,
      description: def.description,
      valueType: def.valueType,
      options: def.options,
      isSensitive: def.isSensitive,
      isTenantScoped: def.isTenantScoped,
      defaultValue: def.defaultValue,
      value: tenantValue ?? def.defaultValue,
      isOverridden: tenantValue !== undefined,
    };
  }

  private validateValue(def: SettingDefinition, value: unknown) {
    switch (def.valueType) {
      case "BOOLEAN":
        if (typeof value !== "boolean") throw new BadRequestException("Valor deve ser booleano.");
        break;
      case "NUMBER":
        if (typeof value !== "number") throw new BadRequestException("Valor deve ser numérico.");
        break;
      case "STRING":
        if (typeof value !== "string") throw new BadRequestException("Valor deve ser texto.");
        break;
      case "SELECT": {
        const options = Array.isArray(def.options) ? def.options : [];
        if (!options.includes(value as Prisma.JsonValue)) {
          throw new BadRequestException("Valor fora das opções permitidas.");
        }
        break;
      }
      case "JSON":
      default:
        break;
    }
  }
}
