import { Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
import type { Request } from "express";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { FeaturesService } from "./features.service";
import { UpdateTenantFeatureDto } from "./dto/feature.dto";

@Controller("features")
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  @RequirePermissions("features.read")
  list(@CurrentUser() user: AuthUserPayload) {
    return this.featuresService.list(user.tenantId);
  }

  @Get("tenant")
  @RequirePermissions("features.read")
  listTenant(@CurrentUser() user: AuthUserPayload) {
    return this.featuresService.listTenant(user.tenantId);
  }

  @Patch("tenant/:featureKey")
  @RequirePermissions("features.manage")
  setTenantFeature(
    @CurrentUser() user: AuthUserPayload,
    @Param("featureKey") featureKey: string,
    @Body() dto: UpdateTenantFeatureDto,
    @Req() req: Request,
  ) {
    return this.featuresService.setTenantFeature(user.tenantId, featureKey, dto, user, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }
}
