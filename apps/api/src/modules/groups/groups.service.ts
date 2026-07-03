import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../../common/audit-actions";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { AssignGroupRoleDto, CreateGroupDto, UpdateGroupDto } from "./dto/group.dto";

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

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.prisma.client.group.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        roles: { select: { role: { select: { id: true, name: true, slug: true } } } },
      },
    });
  }

  async getById(id: string, tenantId: string) {
    const group = await this.prisma.client.group.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        roles: { select: { role: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!group) {
      throw new NotFoundException("Grupo não encontrado.");
    }
    return group;
  }

  async getMembers(id: string, tenantId: string) {
    await this.getExisting(id, tenantId);
    const members = await this.prisma.client.groupMember.findMany({
      where: { groupId: id, tenantId },
      select: {
        user: { select: { id: true, name: true, email: true, status: true } },
      },
    });
    return members.map((m) => m.user);
  }

  async create(tenantId: string, dto: CreateGroupDto, actor: AuthUserPayload, meta: RequestMeta) {
    const slug = slugify(dto.slug ?? dto.name);
    const existing = await this.prisma.client.group.findFirst({
      where: { tenantId, slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("Já existe um grupo com este slug.");
    }

    const group = await this.prisma.client.group.create({
      data: { tenantId, name: dto.name.trim(), slug, description: dto.description },
      select: { id: true, name: true, slug: true, description: true },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.GROUP_CREATED,
      entity: "Group",
      entityId: group.id,
      metadata: { slug },
      ...meta,
    });

    return group;
  }

  async update(id: string, tenantId: string, dto: UpdateGroupDto, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExisting(id, tenantId);

    const group = await this.prisma.client.group.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
      },
      select: { id: true, name: true, slug: true, description: true },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.GROUP_UPDATED,
      entity: "Group",
      entityId: id,
      ...meta,
    });

    return group;
  }

  async remove(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExisting(id, tenantId);

    await this.prisma.client.group.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.GROUP_DELETED,
      entity: "Group",
      entityId: id,
      ...meta,
    });

    return { success: true };
  }

  async addRole(id: string, tenantId: string, dto: AssignGroupRoleDto, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExisting(id, tenantId);
    await this.assertRoleInTenant(tenantId, dto.roleId);

    await this.prisma.client.groupRole.upsert({
      where: { groupId_roleId: { groupId: id, roleId: dto.roleId } },
      update: {},
      create: { tenantId, groupId: id, roleId: dto.roleId },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.GROUP_ROLE_ADDED,
      entity: "Group",
      entityId: id,
      metadata: { roleId: dto.roleId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  async removeRole(id: string, tenantId: string, roleId: string, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExisting(id, tenantId);

    await this.prisma.client.groupRole.deleteMany({ where: { groupId: id, roleId } });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.GROUP_ROLE_REMOVED,
      entity: "Group",
      entityId: id,
      metadata: { roleId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  private async getExisting(id: string, tenantId: string) {
    const group = await this.prisma.client.group.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!group) {
      throw new NotFoundException("Grupo não encontrado.");
    }
    return group;
  }

  private async assertRoleInTenant(tenantId: string, roleId: string) {
    const role = await this.prisma.client.role.findFirst({
      where: { id: roleId, tenantId },
      select: { id: true },
    });
    if (!role) {
      throw new NotFoundException("Papel não pertence ao tenant.");
    }
  }
}
