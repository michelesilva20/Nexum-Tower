import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { hasAllPermissions, hasAnyPermission, permissionMatches } from "@nexum-tower/shared";

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        memberships: {
          include: {
            group: {
              include: {
                roles: {
                  include: {
                    role: {
                      include: {
                        permissions: { include: { permission: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        overrides: { include: { permission: true } },
      },
    });

    if (!user) return [];

    const hasOwnerRole =
      user.userRoles.some((ur) => ur.role.slug === "owner") ||
      user.memberships.some((m) =>
        m.group.roles.some((gr) => gr.role.slug === "owner"),
      );

    if (hasOwnerRole) {
      return ["*"];
    }

    const permissionSet = new Set<string>();

    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.key);
      }
    }

    for (const membership of user.memberships) {
      for (const groupRole of membership.group.roles) {
        for (const rolePermission of groupRole.role.permissions) {
          permissionSet.add(rolePermission.permission.key);
        }
      }
    }

    for (const override of user.overrides) {
      const key = override.permission.key;
      if (override.effect === "DENY") {
        permissionSet.delete(key);
      } else {
        permissionSet.add(key);
      }
    }

    return [...permissionSet].sort();
  }

  async userHasPermission(userId: string, tenantId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    return permissionMatches(permissions, permission);
  }

  async userHasAllPermissions(
    userId: string,
    tenantId: string,
    required: string[],
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    return hasAllPermissions(permissions, required);
  }

  async userHasAnyPermission(
    userId: string,
    tenantId: string,
    required: string[],
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    return hasAnyPermission(permissions, required);
  }

  async getUserRoles(userId: string, tenantId: string): Promise<string[]> {
    const roles = await this.prisma.client.userRole.findMany({
      where: { userId, tenantId },
      include: { role: true },
    });

    const groupRoles = await this.prisma.client.groupMember.findMany({
      where: { userId, tenantId },
      include: {
        group: {
          include: { roles: { include: { role: true } } },
        },
      },
    });

    const names = new Set<string>();
    roles.forEach((r) => names.add(r.role.name));
    groupRoles.forEach((m) => m.group.roles.forEach((gr) => names.add(gr.role.name)));

    return [...names].sort();
  }

  async getUserGroups(userId: string, tenantId: string): Promise<string[]> {
    const memberships = await this.prisma.client.groupMember.findMany({
      where: { userId, tenantId },
      include: { group: true },
    });

    return memberships.map((m) => m.group.name).sort();
  }
}
