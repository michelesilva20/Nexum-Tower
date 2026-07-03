import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthorizationService } from "../authorization/authorization.service";
import { AuditAction } from "../../common/audit-actions";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { AssignPermissionDto, CreateRoleDto, UpdateRoleDto } from "./dto/role.dto";

type RequestMeta = { ipAddress?: string; userAgent?: string };

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const roleDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isSystem: true,
  permissions: { select: { permission: { select: { id: true, key: true } } } },
} as const;

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  list(tenantId: string) {
    return this.prisma.client.role.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: roleDetailSelect,
    });
  }

  async getById(id: string, tenantId: string) {
    const role = await this.prisma.client.role.findFirst({
      where: { id, tenantId },
      select: {
        ...roleDetailSelect,
        userRoles: { select: { user: { select: { id: true, name: true, email: true } } } },
        groupRoles: { select: { group: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!role) {
      throw new NotFoundException("Papel não encontrado.");
    }
    return {
      ...role,
      users: role.userRoles.map((ur) => ur.user),
      groups: role.groupRoles.map((gr) => gr.group),
    };
  }

  async create(tenantId: string, dto: CreateRoleDto, actor: AuthUserPayload, meta: RequestMeta) {
    const slug = slugify(dto.slug ?? dto.name);
    const existing = await this.prisma.client.role.findFirst({
      where: { tenantId, slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("Já existe um papel com este slug.");
    }

    if (dto.permissionIds?.length) {
      await this.assertPermissionsExist(dto.permissionIds);
    }

    const role = await this.prisma.client.role.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        slug,
        description: dto.description,
        isSystem: false,
        permissions: dto.permissionIds?.length
          ? { create: dto.permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      select: roleDetailSelect,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROLE_CREATED,
      entity: "Role",
      entityId: role.id,
      metadata: { slug },
      ...meta,
    });

    return role;
  }

  async update(id: string, tenantId: string, dto: UpdateRoleDto, actor: AuthUserPayload, meta: RequestMeta) {
    const role = await this.getExisting(id, tenantId);
    this.authorization.assertCanModifyRole(actor, role);

    const updated = await this.prisma.client.role.update({
      where: { id },
      data: { name: dto.name?.trim(), description: dto.description },
      select: roleDetailSelect,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROLE_UPDATED,
      entity: "Role",
      entityId: id,
      ...meta,
    });

    return updated;
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    const role = await this.getExisting(id, tenantId);
    this.authorization.assertCanModifyRole(actor, role);

    await this.prisma.client.role.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROLE_DELETED,
      entity: "Role",
      entityId: id,
      ...meta,
    });

    return { success: true };
  }

  async addPermission(
    id: string,
    tenantId: string,
    dto: AssignPermissionDto,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    const role = await this.getExisting(id, tenantId);
    this.authorization.assertCanModifyRole(actor, role);
    await this.assertPermissionsExist([dto.permissionId]);

    await this.prisma.client.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: id, permissionId: dto.permissionId } },
      update: {},
      create: { roleId: id, permissionId: dto.permissionId },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROLE_PERMISSION_ADDED,
      entity: "Role",
      entityId: id,
      metadata: { permissionId: dto.permissionId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  async removePermission(
    id: string,
    tenantId: string,
    permissionId: string,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    const role = await this.getExisting(id, tenantId);
    this.authorization.assertCanModifyRole(actor, role);

    await this.prisma.client.rolePermission.deleteMany({ where: { roleId: id, permissionId } });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.ROLE_PERMISSION_REMOVED,
      entity: "Role",
      entityId: id,
      metadata: { permissionId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  private async getExisting(id: string, tenantId: string) {
    const role = await this.prisma.client.role.findFirst({
      where: { id, tenantId },
      select: { id: true, tenantId: true, isSystem: true },
    });
    if (!role) {
      throw new NotFoundException("Papel não encontrado.");
    }
    return role;
  }

  private async assertPermissionsExist(permissionIds: string[]) {
    const count = await this.prisma.client.permission.count({
      where: { id: { in: permissionIds } },
    });
    if (count !== permissionIds.length) {
      throw new NotFoundException("Uma ou mais permissões não existem.");
    }
  }
}
