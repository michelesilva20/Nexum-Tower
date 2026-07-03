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
import { GroupsService } from "./groups.service";
import { AssignGroupRoleDto, CreateGroupDto, UpdateGroupDto } from "./dto/group.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @RequirePermissions("groups.read")
  list(@CurrentUser() user: AuthUserPayload) {
    return this.groupsService.list(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("groups.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.groupsService.getById(id, user.tenantId);
  }

  @Get(":id/members")
  @RequirePermissions("groups.read")
  getMembers(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.groupsService.getMembers(id, user.tenantId);
  }

  @Post()
  @RequirePermissions("groups.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateGroupDto, @Req() req: Request) {
    return this.groupsService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("groups.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateGroupDto,
    @Req() req: Request,
  ) {
    return this.groupsService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("groups.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.groupsService.remove(id, user.tenantId, user, meta(req));
  }

  @Post(":id/roles")
  @RequirePermissions("groups.manage_roles")
  addRole(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignGroupRoleDto,
    @Req() req: Request,
  ) {
    return this.groupsService.addRole(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id/roles/:roleId")
  @RequirePermissions("groups.manage_roles")
  removeRole(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("roleId") roleId: string,
    @Req() req: Request,
  ) {
    return this.groupsService.removeRole(id, user.tenantId, roleId, user, meta(req));
  }
}
