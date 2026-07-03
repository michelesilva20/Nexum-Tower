import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { buildPaginatedResult, resolvePagination } from "../../common/pagination";

type AuditParams = {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditQuery = {
  action?: string;
  entity?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  limit?: number;
};

const auditSelect = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  user: { select: { name: true, email: true } },
} as const;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditParams) {
    await this.prisma.client.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  /**
   * Lista logs do tenant com filtros opcionais.
   * Sem `page`/`perPage`, mantém o comportamento legado (array, limit=50).
   * Com paginação, retorna PaginatedResult (envelopado pelo interceptor).
   */
  async listLogs(tenantId: string, query: AuditQuery) {
    const where: Prisma.AuditLogWhereInput = { tenantId };
    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;
    if (query.userId) where.userId = query.userId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const isPaginated = query.page !== undefined || query.perPage !== undefined;

    if (!isPaginated) {
      const take = Math.min(Number(query.limit) || 50, 200);
      return this.prisma.client.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        select: auditSelect,
      });
    }

    const { page, perPage, skip, take } = resolvePagination(query);
    const [items, total] = await Promise.all([
      this.prisma.client.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: auditSelect,
      }),
      this.prisma.client.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, perPage);
  }
}
