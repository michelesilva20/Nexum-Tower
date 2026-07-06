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
import { VehiclesService } from "./vehicles.service";
import {
  AssignVehicleBranchesDto,
  CreateVehicleDto,
  ListVehiclesQueryDto,
  UpdateVehicleDto,
} from "./dto/vehicle.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("logistics/vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequireAnyPermissions("vehicles.read", "logistics.read")
  list(@CurrentUser() user: AuthUserPayload, @Query() query: ListVehiclesQueryDto) {
    return this.vehiclesService.list(user.tenantId, user, query);
  }

  @Get(":id")
  @RequireAnyPermissions("vehicles.read", "logistics.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.vehiclesService.getById(id, user.tenantId, user);
  }

  @Post()
  @RequirePermissions("vehicles.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateVehicleDto, @Req() req: Request) {
    return this.vehiclesService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("vehicles.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateVehicleDto,
    @Req() req: Request,
  ) {
    return this.vehiclesService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/disable")
  @RequirePermissions("vehicles.disable")
  disable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.vehiclesService.disable(id, user.tenantId, user, meta(req));
  }

  @Patch(":id/enable")
  @RequirePermissions("vehicles.disable")
  enable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.vehiclesService.enable(id, user.tenantId, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("vehicles.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.vehiclesService.remove(id, user.tenantId, user, meta(req));
  }

  @Get(":id/branches")
  @RequireAnyPermissions("vehicles.read", "logistics.read")
  listBranches(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.vehiclesService.listBranches(id, user.tenantId, user);
  }

  @Post(":id/branches")
  @RequirePermissions("vehicles.assign_branches")
  assignBranches(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignVehicleBranchesDto,
    @Req() req: Request,
  ) {
    return this.vehiclesService.assignBranches(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/branches/:branchId/primary")
  @RequirePermissions("vehicles.assign_branches")
  setPrimary(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.vehiclesService.setPrimaryBranch(id, user.tenantId, { branchId }, user, meta(req));
  }

  @Delete(":id/branches/:branchId")
  @RequirePermissions("vehicles.assign_branches")
  removeBranch(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.vehiclesService.removeBranch(id, user.tenantId, branchId, user, meta(req));
  }
}
