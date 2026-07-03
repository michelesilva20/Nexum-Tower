import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { AuditService } from "./audit.service";
import { AuditQueryDto } from "./dto/audit-query.dto";

@Controller("audit")
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermissions("audit.read")
  list(@CurrentUser() user: AuthUserPayload, @Query() query: AuditQueryDto) {
    return this.audit.listLogs(user.tenantId, query);
  }

  // Alias legado mantido para compatibilidade com o frontend atual.
  @Get("logs")
  @RequirePermissions("audit.read")
  listLogs(@CurrentUser() user: AuthUserPayload, @Query() query: AuditQueryDto) {
    return this.audit.listLogs(user.tenantId, query);
  }

  @Get(":id")
  @RequirePermissions("audit.read")
  async getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    const log = await this.prisma.client.auditLog.findFirst({
      where: { id, tenantId: user.tenantId },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!log) {
      throw new NotFoundException("Registro de auditoria não encontrado.");
    }
    return log;
  }
}
