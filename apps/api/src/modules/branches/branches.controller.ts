import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { BranchesService } from "./branches.service";
import {
  AssignUserBranchDto,
  CreateBranchDto,
  ListBranchesQueryDto,
  UpdateBranchDto,
} from "./dto/branch.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions("branches.read")
  list(@CurrentUser() user: AuthUserPayload, @Query() query: ListBranchesQueryDto) {
    return this.branchesService.list(user.tenantId, user, query);
  }

  @Get(":id")
  @RequirePermissions("branches.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.branchesService.getById(id, user.tenantId, user);
  }

  @Post()
  @RequirePermissions("branches.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateBranchDto, @Req() req: Request) {
    return this.branchesService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("branches.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateBranchDto,
    @Req() req: Request,
  ) {
    return this.branchesService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/disable")
  @RequirePermissions("branches.disable")
  disable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.branchesService.disable(id, user.tenantId, user, meta(req));
  }

  @Patch(":id/enable")
  @RequirePermissions("branches.disable")
  enable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.branchesService.enable(id, user.tenantId, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("branches.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.branchesService.remove(id, user.tenantId, user, meta(req));
  }

  @Get(":id/users")
  @RequirePermissions("branches.read")
  listUsers(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.branchesService.listUsers(id, user.tenantId, user);
  }

  @Post(":id/users")
  @RequirePermissions("branches.assign_users")
  assignUser(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignUserBranchDto,
    @Req() req: Request,
  ) {
    return this.branchesService.assignUser(id, user.tenantId, dto, user, meta(req));
  }

  @Delete(":id/users/:userId")
  @RequirePermissions("branches.assign_users")
  removeUser(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Req() req: Request,
  ) {
    return this.branchesService.removeUser(id, user.tenantId, userId, user, meta(req));
  }
}
