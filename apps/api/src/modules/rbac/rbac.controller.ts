import { Controller, Get } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUserPayload } from "../auth/types/auth-user.type";

@Controller("rbac")
export class RbacController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("permissions")
  @RequirePermissions("permissions.read")
  async listPermissions(@CurrentUser() _user: AuthUserPayload) {
    return this.prisma.client.permission.findMany({
      orderBy: [{ module: "asc" }, { key: "asc" }],
      select: {
        id: true,
        key: true,
        module: true,
        resource: true,
        action: true,
        description: true,
      },
    });
  }

  @Get("roles")
  @RequirePermissions("roles.read")
  async listRoles(@CurrentUser() user: AuthUserPayload) {
    return this.prisma.client.role.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        permissions: {
          select: {
            permission: {
              select: { key: true },
            },
          },
        },
      },
    });
  }

  @Get("groups")
  @RequirePermissions("groups.read")
  async listGroups(@CurrentUser() user: AuthUserPayload) {
    return this.prisma.client.group.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        roles: {
          select: {
            role: {
              select: { name: true, slug: true },
            },
          },
        },
      },
    });
  }
}
