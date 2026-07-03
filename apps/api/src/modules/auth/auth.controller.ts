import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { CookieOptions, Request, Response } from "express";
import { Public } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DEFAULT_ACCESS_TOKEN_MS, parseDurationMs } from "../../common/duration";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  type AuthUserPayload,
} from "./types/auth-user.type";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    this.setRefreshCookie(res, result.refreshToken);
    this.setAccessCookie(res, result.accessToken);

    return { user: result.user };
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      return { user: null };
    }

    const result = await this.authService.refresh(refreshToken, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    this.setRefreshCookie(res, result.refreshToken);
    this.setAccessCookie(res, result.accessToken);

    return { user: result.user };
  }

  @Post("logout")
  async logout(
    @CurrentUser() user: AuthUserPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sessionId, user.userId, user.tenantId, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    this.clearAuthCookies(res);
    return { success: true };
  }

  @Post("logout-all")
  async logoutAll(
    @CurrentUser() user: AuthUserPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeAllSessions(user.userId, user.tenantId, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get("me")
  async me(@CurrentUser() user: AuthUserPayload) {
    return this.authService.getMe(user.userId, user.tenantId);
  }

  @Get("sessions")
  async sessions(@CurrentUser() user: AuthUserPayload) {
    return this.authService.listSessions(user.userId, user.tenantId, user.sessionId);
  }

  @Delete("sessions/:sessionId")
  async revokeSession(
    @CurrentUser() user: AuthUserPayload,
    @Param("sessionId") sessionId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeSession(sessionId, user.userId, user.tenantId, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Se o usuário revogou a própria sessão atual, limpa os cookies.
    if (sessionId === user.sessionId) {
      this.clearAuthCookies(res);
    }

    return { success: true };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, this.cookieOptions(this.getRefreshMaxAge()));
  }

  private setAccessCookie(res: Response, accessToken: string) {
    res.cookie(ACCESS_COOKIE_NAME, accessToken, this.cookieOptions(this.getAccessMaxAge()));
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions(this.getRefreshMaxAge()));
    res.clearCookie(ACCESS_COOKIE_NAME, this.cookieOptions(this.getAccessMaxAge()));
  }

  private getRefreshMaxAge() {
    // Alinhado com REFRESH_TOKEN_EXPIRES_IN usado ao criar a sessão no service.
    return this.authService.getRefreshExpiresMs();
  }

  private getAccessMaxAge() {
    const value = this.config.get<string>("ACCESS_TOKEN_EXPIRES_IN", "15m");
    return parseDurationMs(value, DEFAULT_ACCESS_TOKEN_MS);
  }

  private cookieOptions(maxAge: number): CookieOptions {
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    const secureCfg = this.config.get<string>("AUTH_COOKIE_SECURE");
    const sameSiteCfg = this.config.get<string>("AUTH_COOKIE_SAMESITE");
    const domainCfg = this.config.get<string>("AUTH_COOKIE_DOMAIN");

    const secure = secureCfg ? secureCfg === "true" : isProd;
    const sameSite = (sameSiteCfg as CookieOptions["sameSite"]) ?? "lax";
    const domain = domainCfg && domainCfg.length > 0 ? domainCfg : undefined;

    return {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: "/",
      maxAge,
    };
  }
}
