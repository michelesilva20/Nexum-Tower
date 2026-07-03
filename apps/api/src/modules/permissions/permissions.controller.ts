import { Controller, Get } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { PermissionsService } from "./permissions.service";

@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions("permissions.read")
  list() {
    return this.permissionsService.list();
  }

  @Get("modules")
  @RequirePermissions("permissions.read")
  listModules() {
    return this.permissionsService.listModules();
  }
}
