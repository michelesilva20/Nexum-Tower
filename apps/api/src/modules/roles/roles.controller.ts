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
import { RolesService } from "./roles.service";
import { AssignPermissionDto, CreateRoleDto, UpdateRoleDto } from "./dto/role.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions("roles.read")
  list(@CurrentUser() user: AuthUserPayload) {
    return this.rolesService.list(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("roles.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.rolesService.getById(id, user.tenantId);
  }

  @Post()
  @RequirePermissions("roles.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateRoleDto, @Req() req: Request) {
    return this.rolesService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("roles.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    return this.rolesService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("roles.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.rolesService.remove(id, user.tenantId, user, meta(req));
  }

  @Post(":id/permissions")
  @RequirePermissions("roles.manage_permissions")
  addPermission(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignPermissionDto,
    @Req() req: Request,
  ) {
    return this.rolesService.addPermission(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id/permissions/:permissionId")
  @RequirePermissions("roles.manage_permissions")
  removePermission(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("permissionId") permissionId: string,
    @Req() req: Request,
  ) {
    return this.rolesService.removePermission(id, user.tenantId, permissionId, user, meta(req));
  }
}
