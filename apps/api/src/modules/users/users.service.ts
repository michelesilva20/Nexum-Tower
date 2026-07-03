import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { RbacService } from "../rbac/rbac.service";
import { AuthorizationService } from "../authorization/authorization.service";
import { AuditAction } from "../../common/audit-actions";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import {
  AssignGroupDto,
  AssignRoleDto,
  CreateOverrideDto,
  CreateUserDto,
  UpdateUserDto,
} from "./dto/user.dto";

const OWNER_ROLE_SLUG = "owner";
const BCRYPT_COST = 12;

type RequestMeta = { ipAddress?: string; userAgent?: string };

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rbac: RbacService,
    private readonly authorization: AuthorizationService,
  ) {}

  listByTenant(tenantId: string) {
    return this.prisma.client.user.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: userSummarySelect,
    });
  }

  async getById(id: string, tenantId: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: {
        ...userSummarySelect,
        userRoles: { select: { role: { select: { id: true, name: true, slug: true } } } },
        memberships: { select: { group: { select: { id: true, name: true, slug: true } } } },
        overrides: {
          select: {
            id: true,
            effect: true,
            reason: true,
            permission: { select: { id: true, key: true, description: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.");
    }

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
      groups: user.memberships.map((m) => m.group),
    };
  }

  async create(tenantId: string, dto: CreateUserDto, actor: AuthUserPayload, meta: RequestMeta) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.client.user.findFirst({
      where: { tenantId, email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("Já existe um usuário com este e-mail.");
    }

    await this.assertRolesInTenant(tenantId, dto.roleIds);
    await this.assertGroupsInTenant(tenantId, dto.groupIds);

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, BCRYPT_COST) : null;
    const status: UserStatus = dto.password ? "ACTIVE" : "INVITED";

    const user = await this.prisma.client.user.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        email,
        passwordHash,
        status,
        userRoles: dto.roleIds?.length
          ? { create: dto.roleIds.map((roleId) => ({ tenantId, roleId })) }
          : undefined,
        memberships: dto.groupIds?.length
          ? { create: dto.groupIds.map((groupId) => ({ tenantId, groupId })) }
          : undefined,
      },
      select: userSummarySelect,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_CREATED,
      entity: "User",
      entityId: user.id,
      metadata: { email, status, roleIds: dto.roleIds ?? [], groupIds: dto.groupIds ?? [] },
      ...meta,
    });

    return user;
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExistingUser(id, tenantId);

    const data: { name?: string; passwordHash?: string } = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.prisma.client.user.update({
      where: { id },
      data,
      select: userSummarySelect,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_UPDATED,
      entity: "User",
      entityId: id,
      metadata: { fields: Object.keys(data) },
      ...meta,
    });

    return user;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: UserStatus,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    await this.getExistingUser(id, tenantId);

    if (status !== "ACTIVE") {
      await this.assertNotLastOwner(tenantId, id);
    }

    const user = await this.prisma.client.user.update({
      where: { id },
      data: { status },
      select: userSummarySelect,
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: status === "DISABLED" ? AuditAction.USER_DISABLED : AuditAction.USER_UPDATED,
      entity: "User",
      entityId: id,
      metadata: { status },
      ...meta,
    });

    return user;
  }

  /** Soft delete: nunca apaga o registro, apenas desativa. */
  async softDelete(id: string, tenantId: string, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExistingUser(id, tenantId);

    if (id === actor.userId) {
      throw new ForbiddenException("Você não pode remover a si mesmo.");
    }
    await this.assertNotLastOwner(tenantId, id);

    await this.prisma.client.user.update({
      where: { id },
      data: { status: "DISABLED" },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_DELETED,
      entity: "User",
      entityId: id,
      ...meta,
    });

    return { success: true };
  }

  async addRole(id: string, tenantId: string, dto: AssignRoleDto, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExistingUser(id, tenantId);
    await this.assertRolesInTenant(tenantId, [dto.roleId]);

    await this.prisma.client.userRole.upsert({
      where: { userId_roleId: { userId: id, roleId: dto.roleId } },
      update: {},
      create: { tenantId, userId: id, roleId: dto.roleId },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_ROLE_ADDED,
      entity: "User",
      entityId: id,
      metadata: { roleId: dto.roleId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  async removeRole(id: string, tenantId: string, roleId: string, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExistingUser(id, tenantId);

    const role = await this.prisma.client.role.findFirst({
      where: { id: roleId, tenantId },
      select: { slug: true },
    });
    if (role?.slug === OWNER_ROLE_SLUG) {
      await this.assertNotLastOwner(tenantId, id);
    }

    await this.prisma.client.userRole.deleteMany({ where: { userId: id, roleId } });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_ROLE_REMOVED,
      entity: "User",
      entityId: id,
      metadata: { roleId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  async addGroup(id: string, tenantId: string, dto: AssignGroupDto, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExistingUser(id, tenantId);
    await this.assertGroupsInTenant(tenantId, [dto.groupId]);

    await this.prisma.client.groupMember.upsert({
      where: { userId_groupId: { userId: id, groupId: dto.groupId } },
      update: {},
      create: { tenantId, userId: id, groupId: dto.groupId },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_GROUP_ADDED,
      entity: "User",
      entityId: id,
      metadata: { groupId: dto.groupId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  async removeGroup(id: string, tenantId: string, groupId: string, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExistingUser(id, tenantId);

    await this.prisma.client.groupMember.deleteMany({ where: { userId: id, groupId } });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_GROUP_REMOVED,
      entity: "User",
      entityId: id,
      metadata: { groupId },
      ...meta,
    });

    return this.getById(id, tenantId);
  }

  async getPermissions(id: string, tenantId: string) {
    await this.getExistingUser(id, tenantId);
    const permissions = await this.rbac.getUserPermissions(id, tenantId);
    return { permissions };
  }

  async addOverride(id: string, tenantId: string, dto: CreateOverrideDto, actor: AuthUserPayload, meta: RequestMeta) {
    await this.getExistingUser(id, tenantId);

    const permission = await this.prisma.client.permission.findUnique({
      where: { id: dto.permissionId },
      select: { id: true, key: true },
    });
    if (!permission) {
      throw new NotFoundException("Permissão não encontrada.");
    }

    const override = await this.prisma.client.userPermissionOverride.upsert({
      where: { userId_permissionId: { userId: id, permissionId: dto.permissionId } },
      update: { effect: dto.effect, reason: dto.reason },
      create: {
        tenantId,
        userId: id,
        permissionId: dto.permissionId,
        effect: dto.effect,
        reason: dto.reason,
      },
      select: { id: true, effect: true, reason: true },
    });

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_PERMISSION_OVERRIDE_ADDED,
      entity: "User",
      entityId: id,
      metadata: { permissionKey: permission.key, effect: dto.effect },
      ...meta,
    });

    return override;
  }

  async removeOverride(
    id: string,
    tenantId: string,
    overrideId: string,
    actor: AuthUserPayload,
    meta: RequestMeta,
  ) {
    await this.getExistingUser(id, tenantId);

    const result = await this.prisma.client.userPermissionOverride.deleteMany({
      where: { id: overrideId, userId: id, tenantId },
    });
    if (result.count === 0) {
      throw new NotFoundException("Override não encontrado.");
    }

    await this.audit.log({
      tenantId,
      userId: actor.userId,
      action: AuditAction.USER_PERMISSION_OVERRIDE_REMOVED,
      entity: "User",
      entityId: id,
      metadata: { overrideId },
      ...meta,
    });

    return { success: true };
  }

  private async getExistingUser(id: string, tenantId: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true, tenantId: true },
    });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado.");
    }
    // Reforço explícito da regra de object-level authorization.
    this.authorization.assertSameTenant(user.tenantId, tenantId);
    return user;
  }

  private async assertRolesInTenant(tenantId: string, roleIds?: string[]) {
    if (!roleIds?.length) return;
    const count = await this.prisma.client.role.count({
      where: { id: { in: roleIds }, tenantId },
    });
    if (count !== roleIds.length) {
      throw new NotFoundException("Um ou mais papéis não pertencem ao tenant.");
    }
  }

  private async assertGroupsInTenant(tenantId: string, groupIds?: string[]) {
    if (!groupIds?.length) return;
    const count = await this.prisma.client.group.count({
      where: { id: { in: groupIds }, tenantId },
    });
    if (count !== groupIds.length) {
      throw new NotFoundException("Um ou mais grupos não pertencem ao tenant.");
    }
  }

  /** Impede desativar/remover o último owner ativo do tenant. */
  private async assertNotLastOwner(tenantId: string, userId: string) {
    const ownerRole = await this.prisma.client.role.findFirst({
      where: { tenantId, slug: OWNER_ROLE_SLUG },
      select: { id: true },
    });
    if (!ownerRole) return;

    const owners = await this.prisma.client.userRole.findMany({
      where: { tenantId, roleId: ownerRole.id, user: { status: "ACTIVE" } },
      select: { userId: true },
    });

    const targetIsOwner = owners.some((o) => o.userId === userId);
    if (targetIsOwner && owners.length <= 1) {
      throw new ForbiddenException("Não é possível remover ou desativar o último owner do tenant.");
    }
  }
}
