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
import { LocationsService } from "./locations.service";
import {
  AssignLocationBranchesDto,
  CreateLocationDto,
  ListLocationsQueryDto,
  UpdateLocationDto,
} from "./dto/location.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("logistics/locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequireAnyPermissions("locations.read", "logistics.read")
  list(@CurrentUser() user: AuthUserPayload, @Query() query: ListLocationsQueryDto) {
    return this.locationsService.list(user.tenantId, user, query);
  }

  @Get(":id")
  @RequireAnyPermissions("locations.read", "logistics.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.locationsService.getById(id, user.tenantId, user);
  }

  @Post()
  @RequirePermissions("locations.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateLocationDto, @Req() req: Request) {
    return this.locationsService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("locations.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateLocationDto,
    @Req() req: Request,
  ) {
    return this.locationsService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/disable")
  @RequirePermissions("locations.disable")
  disable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.locationsService.disable(id, user.tenantId, user, meta(req));
  }

  @Patch(":id/enable")
  @RequirePermissions("locations.disable")
  enable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.locationsService.enable(id, user.tenantId, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("locations.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.locationsService.remove(id, user.tenantId, user, meta(req));
  }

  @Get(":id/branches")
  @RequireAnyPermissions("locations.read", "logistics.read")
  listBranches(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.locationsService.listBranches(id, user.tenantId, user);
  }

  @Post(":id/branches")
  @RequirePermissions("locations.assign_branches")
  assignBranches(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignLocationBranchesDto,
    @Req() req: Request,
  ) {
    return this.locationsService.assignBranches(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/branches/:branchId/primary")
  @RequirePermissions("locations.assign_branches")
  setPrimary(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.locationsService.setPrimaryBranch(id, user.tenantId, { branchId }, user, meta(req));
  }

  @Delete(":id/branches/:branchId")
  @RequirePermissions("locations.assign_branches")
  removeBranch(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.locationsService.removeBranch(id, user.tenantId, branchId, user, meta(req));
  }
}
