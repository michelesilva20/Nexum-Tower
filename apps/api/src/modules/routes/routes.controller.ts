import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { RequireAnyPermissions, RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import {
  AssignRouteBranchesDto,
  CreateRouteDto,
  ListRoutesQueryDto,
  ReplaceRoutePointsDto,
  UpdateRouteDto,
} from "./dto/route.dto";
import { RoutesService } from "./routes.service";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("logistics/routes")
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @RequireAnyPermissions("routes.read", "logistics.read")
  list(@CurrentUser() user: AuthUserPayload, @Query() query: ListRoutesQueryDto) {
    return this.routesService.list(user.tenantId, user, query);
  }

  @Get(":id")
  @RequireAnyPermissions("routes.read", "logistics.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.routesService.getById(id, user.tenantId, user);
  }

  @Post()
  @RequirePermissions("routes.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateRouteDto, @Req() req: Request) {
    return this.routesService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("routes.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateRouteDto,
    @Req() req: Request,
  ) {
    return this.routesService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/disable")
  @RequirePermissions("routes.disable")
  disable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.routesService.disable(id, user.tenantId, user, meta(req));
  }

  @Patch(":id/enable")
  @RequirePermissions("routes.disable")
  enable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.routesService.enable(id, user.tenantId, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("routes.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.routesService.remove(id, user.tenantId, user, meta(req));
  }

  @Get(":id/branches")
  @RequireAnyPermissions("routes.read", "logistics.read")
  listBranches(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.routesService.listBranches(id, user.tenantId, user);
  }

  @Post(":id/branches")
  @RequirePermissions("routes.assign_branches")
  assignBranches(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignRouteBranchesDto,
    @Req() req: Request,
  ) {
    return this.routesService.assignBranches(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/branches/:branchId/primary")
  @RequirePermissions("routes.assign_branches")
  setPrimary(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.routesService.setPrimaryBranch(id, user.tenantId, { branchId }, user, meta(req));
  }

  @Delete(":id/branches/:branchId")
  @RequirePermissions("routes.assign_branches")
  removeBranch(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.routesService.removeBranch(id, user.tenantId, branchId, user, meta(req));
  }

  @Get(":id/points")
  @RequireAnyPermissions("routes.read", "logistics.read")
  listPoints(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.routesService.listPoints(id, user.tenantId, user);
  }

  @Put(":id/points")
  @RequirePermissions("routes.manage_points")
  replacePoints(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: ReplaceRoutePointsDto,
    @Req() req: Request,
  ) {
    return this.routesService.replacePoints(id, user.tenantId, dto, user, meta(req));
  }
}
