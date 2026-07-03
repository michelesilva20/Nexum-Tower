import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { UsersService } from "./users.service";
import {
  AssignGroupDto,
  AssignRoleDto,
  CreateOverrideDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from "./dto/user.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions("users.read")
  list(@CurrentUser() user: AuthUserPayload) {
    return this.usersService.listByTenant(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("users.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.usersService.getById(id, user.tenantId);
  }

  @Get(":id/permissions")
  @RequirePermissions("users.read")
  getPermissions(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.usersService.getPermissions(id, user.tenantId);
  }

  @Post()
  @RequirePermissions("users.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateUserDto, @Req() req: Request) {
    return this.usersService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("users.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/status")
  @RequirePermissions("users.disable")
  updateStatus(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
  ) {
    return this.usersService.updateStatus(id, user.tenantId, dto.status, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("users.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.usersService.softDelete(id, user.tenantId, user, meta(req));
  }

  @Post(":id/roles")
  @RequirePermissions("users.manage_roles")
  addRole(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignRoleDto,
    @Req() req: Request,
  ) {
    return this.usersService.addRole(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id/roles/:roleId")
  @RequirePermissions("users.manage_roles")
  removeRole(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("roleId") roleId: string,
    @Req() req: Request,
  ) {
    return this.usersService.removeRole(id, user.tenantId, roleId, user, meta(req));
  }

  @Post(":id/groups")
  @RequirePermissions("users.manage_groups")
  addGroup(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignGroupDto,
    @Req() req: Request,
  ) {
    return this.usersService.addGroup(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id/groups/:groupId")
  @RequirePermissions("users.manage_groups")
  removeGroup(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("groupId") groupId: string,
    @Req() req: Request,
  ) {
    return this.usersService.removeGroup(id, user.tenantId, groupId, user, meta(req));
  }

  @Post(":id/permission-overrides")
  @RequirePermissions("users.manage_overrides")
  addOverride(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: CreateOverrideDto,
    @Req() req: Request,
  ) {
    return this.usersService.addOverride(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id/permission-overrides/:overrideId")
  @RequirePermissions("users.manage_overrides")
  removeOverride(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("overrideId") overrideId: string,
    @Req() req: Request,
  ) {
    return this.usersService.removeOverride(id, user.tenantId, overrideId, user, meta(req));
  }
}
