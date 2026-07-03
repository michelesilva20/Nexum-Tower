import { Injectable, NotFoundException } from "@nestjs/common";
import { Feature, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../../common/audit-actions";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { UpdateTenantFeatureDto } from "./dto/feature.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

@Injectable()
export class FeaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Catálogo global de features com o estado do tenant mesclado. */
  async list(tenantId: string) {
    const [features, tenantFeatures] = await Promise.all([
      this.prisma.client.feature.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] }),
      this.prisma.client.tenantFeature.findMany({ where: { tenantId } }),
    ]);

    const byFeature = new Map(tenantFeatures.map((tf) => [tf.featureId, tf]));
    return features.map((feature) => this.merge(feature, byFeature.get(feature.id)));
  }

  /** Apenas o estado tenant-scoped (chave + enabled + config). */
  async listTenant(tenantId: string) {
    const merged = await this.list(tenantId);
    return merged.map(({ key, enabled, config }) => ({ key, enabled, config }));
  }

  async setTenantFeature(
    tenantId: string,
    featureKey: string,
    dto: UpdateTenantFeatureDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    const feature = await this.prisma.client.feature.findUnique({ where: { key: featureKey } });
    if (!feature) {
      throw new NotFoundException("Feature não encontrada.");
    }

    const current = await this.prisma.client.tenantFeature.findFirst({
      where: { tenantId, featureId: feature.id },
    });
    const oldEnabled = current?.enabled ?? false;

    const updated = await this.prisma.client.tenantFeature.upsert({
      where: { tenantId_featureId: { tenantId, featureId: feature.id } },
      update: { enabled: dto.enabled, config: dto.config as Prisma.InputJsonValue },
      create: {
        tenantId,
        featureId: feature.id,
        enabled: dto.enabled,
        config: dto.config as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.FEATURE_FLAG_UPDATED,
      entity: "TenantFeature",
      entityId: feature.key,
      metadata: { key: feature.key, oldEnabled, newEnabled: dto.enabled },
      ...meta,
    });

    return this.merge(feature, updated);
  }

  private merge(feature: Feature, tenantFeature?: { enabled: boolean; config: Prisma.JsonValue | null }) {
    return {
      key: feature.key,
      name: feature.name,
      description: feature.description,
      module: feature.module,
      enabled: tenantFeature?.enabled ?? false,
      config: tenantFeature?.config ?? null,
    };
  }
}
