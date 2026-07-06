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
import { RequireAnyPermissions, RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { DriversService } from "./drivers.service";
import {
  AssignDriverBranchesDto,
  CreateDriverDto,
  ListDriversQueryDto,
  UpdateDriverDto,
} from "./dto/driver.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("logistics/drivers")
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @RequireAnyPermissions("drivers.read", "logistics.read")
  list(@CurrentUser() user: AuthUserPayload, @Query() query: ListDriversQueryDto) {
    return this.driversService.list(user.tenantId, user, query);
  }

  @Get(":id")
  @RequireAnyPermissions("drivers.read", "logistics.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.driversService.getById(id, user.tenantId, user);
  }

  @Post()
  @RequirePermissions("drivers.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateDriverDto, @Req() req: Request) {
    return this.driversService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("drivers.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateDriverDto,
    @Req() req: Request,
  ) {
    return this.driversService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/disable")
  @RequirePermissions("drivers.disable")
  disable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.driversService.disable(id, user.tenantId, user, meta(req));
  }

  @Patch(":id/enable")
  @RequirePermissions("drivers.disable")
  enable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.driversService.enable(id, user.tenantId, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("drivers.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.driversService.remove(id, user.tenantId, user, meta(req));
  }

  @Get(":id/branches")
  @RequireAnyPermissions("drivers.read", "logistics.read")
  listBranches(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.driversService.listBranches(id, user.tenantId, user);
  }

  @Post(":id/branches")
  @RequirePermissions("drivers.assign_branches")
  assignBranches(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignDriverBranchesDto,
    @Req() req: Request,
  ) {
    return this.driversService.assignBranches(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/branches/:branchId/primary")
  @RequirePermissions("drivers.assign_branches")
  setPrimary(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.driversService.setPrimaryBranch(id, user.tenantId, { branchId }, user, meta(req));
  }

  @Delete(":id/branches/:branchId")
  @RequirePermissions("drivers.assign_branches")
  removeBranch(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.driversService.removeBranch(id, user.tenantId, branchId, user, meta(req));
  }
}
