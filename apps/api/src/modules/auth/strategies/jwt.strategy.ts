import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import { AuthService } from "../auth.service";
import { RbacService } from "../../rbac/rbac.service";
import { ACCESS_COOKIE_NAME } from "../types/auth-user.type";
import type { AuthUserPayload } from "../types/auth-user.type";

type JwtPayload = {
  sub: string;
  tenantId: string;
  sessionId: string;
  email: string;
};

function accessSecret(config: ConfigService): string {
  return (
    config.get<string>("JWT_ACCESS_SECRET") ??
    (config.get<string>("NODE_ENV") === "production"
      ? "missing-secret"
      : "dev-access-secret-change-me-32chars-min")
  );
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
    private readonly rbac: RbacService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.[ACCESS_COOKIE_NAME] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: accessSecret(config),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUserPayload> {
    const valid = await this.authService.validateSession(
      payload.sessionId,
      payload.sub,
      payload.tenantId,
    );

    if (!valid) {
      throw new UnauthorizedException("Sessão inválida.");
    }

    const permissions = await this.rbac.getUserPermissions(payload.sub, payload.tenantId);

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      sessionId: payload.sessionId,
      email: payload.email,
      permissions,
    };
  }
}
