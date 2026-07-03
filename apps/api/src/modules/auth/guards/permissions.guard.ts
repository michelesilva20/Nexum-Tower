import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasAllPermissions, permissionMatches } from "@nexum-tower/shared";
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
  type PermissionsMode,
} from "../../../common/decorators/auth.decorators";
import type { AuthUserPayload } from "../types/auth-user.type";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const mode = this.reflector.getAllAndOverride<PermissionsMode>(PERMISSIONS_MODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? "all";

    const request = context.switchToHttp().getRequest<{
      user?: AuthUserPayload;
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Sem permissão.");
    }

    const allowed =
      mode === "any"
        ? required.some((permission) => permissionMatches(user.permissions, permission))
        : hasAllPermissions(user.permissions, required);

    if (!allowed) {
      await this.audit.log({
        tenantId: user.tenantId,
        userId: user.userId,
        action: "PERMISSION_DENIED",
        metadata: { required, mode },
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] as string | undefined,
      });
      throw new ForbiddenException("Sem permissão.");
    }

    return true;
  }
}
