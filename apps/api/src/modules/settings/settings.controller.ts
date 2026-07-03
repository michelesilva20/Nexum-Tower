import { Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
import type { Request } from "express";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { SettingsService } from "./settings.service";
import { UpdateSettingDto } from "./dto/setting.dto";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions("settings.read")
  list(@CurrentUser() user: AuthUserPayload) {
    return this.settingsService.list(user.tenantId);
  }

  @Get("modules")
  @RequirePermissions("settings.read")
  listModules() {
    return this.settingsService.listModules();
  }

  @Get(":key")
  @RequirePermissions("settings.read")
  getByKey(@CurrentUser() user: AuthUserPayload, @Param("key") key: string) {
    return this.settingsService.getByKey(user.tenantId, key);
  }

  @Patch(":key")
  @RequirePermissions("settings.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("key") key: string,
    @Body() dto: UpdateSettingDto,
    @Req() req: Request,
  ) {
    return this.settingsService.update(user.tenantId, key, dto.value, user, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }
}
