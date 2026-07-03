import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { RbacService } from "../rbac/rbac.service";
import { AuditService } from "../audit/audit.service";
import { DEFAULT_REFRESH_TOKEN_MS, parseDurationMs } from "../../common/duration";
import type { AuthUserResponse, AuthSessionSummary } from "./types/auth-user.type";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly rbac: RbacService,
    private readonly audit: AuditService,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  getRefreshExpiresMs(): number {
    const value = this.config.get<string>("REFRESH_TOKEN_EXPIRES_IN", "7d");
    return parseDurationMs(value, DEFAULT_REFRESH_TOKEN_MS);
  }

  async login(
    email: string,
    password: string,
    meta: RequestMeta,
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUserResponse }> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.client.user.findFirst({
      where: { email: normalizedEmail, status: "ACTIVE" },
      include: { tenant: true },
    });

    if (!user?.passwordHash) {
      await this.audit.log({
        tenantId: user?.tenantId ?? "unknown",
        action: "LOGIN_FAILED",
        metadata: { email: normalizedEmail, reason: "invalid_credentials" },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.audit.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: "LOGIN_FAILED",
        metadata: { reason: "invalid_credentials" },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const session = await this.createSession(user.id, user.tenantId, meta);
    const permissions = await this.rbac.getUserPermissions(user.id, user.tenantId);
    const accessToken = await this.createAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: session.id,
      email: user.email,
    });

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "AuthSession",
      entityId: session.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
      user: await this.buildUserResponse(user.id, user.tenantId, permissions),
    };
  }

  async refresh(
    refreshToken: string,
    meta: RequestMeta,
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUserResponse }> {
    const session = await this.findValidSession(refreshToken);
    if (!session) {
      throw new UnauthorizedException("Sessão inválida.");
    }

    const user = await this.prisma.client.user.findFirst({
      where: { id: session.userId, tenantId: session.tenantId, status: "ACTIVE" },
    });

    if (!user) {
      throw new UnauthorizedException("Sessão inválida.");
    }

    const newRefreshToken = randomBytes(48).toString("hex");
    await this.prisma.client.authSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: this.hashToken(newRefreshToken) },
    });

    const permissions = await this.rbac.getUserPermissions(user.id, user.tenantId);
    const accessToken = await this.createAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: session.id,
      email: user.email,
    });

    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: "TOKEN_REFRESH",
      entity: "AuthSession",
      entityId: session.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: await this.buildUserResponse(user.id, user.tenantId, permissions),
    };
  }

  async logout(sessionId: string, userId: string, tenantId: string, meta: RequestMeta) {
    await this.prisma.client.authSession.updateMany({
      where: { id: sessionId, userId, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: "LOGOUT",
      entity: "AuthSession",
      entityId: sessionId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  async logoutByRefreshToken(refreshToken: string, meta: RequestMeta) {
    const session = await this.findValidSession(refreshToken);
    if (!session) return;

    await this.logout(session.id, session.userId, session.tenantId, meta);
  }

  /** Lista as sessões ativas do próprio usuário (nunca expõe o hash do refresh). */
  async listSessions(
    userId: string,
    tenantId: string,
    currentSessionId: string,
  ): Promise<AuthSessionSummary[]> {
    const sessions = await this.prisma.client.authSession.findMany({
      where: {
        userId,
        tenantId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      current: session.id === currentSessionId,
    }));
  }

  /** Revoga uma sessão específica do próprio usuário. */
  async revokeSession(sessionId: string, userId: string, tenantId: string, meta: RequestMeta) {
    const result = await this.prisma.client.authSession.updateMany({
      where: { id: sessionId, userId, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException("Sessão não encontrada.");
    }

    await this.audit.log({
      tenantId,
      userId,
      action: "SESSION_REVOKED",
      entity: "AuthSession",
      entityId: sessionId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /** Revoga todas as sessões ativas do usuário (logout global). */
  async revokeAllSessions(userId: string, tenantId: string, meta: RequestMeta) {
    const result = await this.prisma.client.authSession.updateMany({
      where: { userId, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: "LOGOUT_ALL",
      entity: "AuthSession",
      metadata: { revokedCount: result.count },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  async getMe(userId: string, tenantId: string): Promise<AuthUserResponse> {
    const permissions = await this.rbac.getUserPermissions(userId, tenantId);
    return this.buildUserResponse(userId, tenantId, permissions);
  }

  async validateSession(sessionId: string, userId: string, tenantId: string) {
    const session = await this.prisma.client.authSession.findFirst({
      where: {
        id: sessionId,
        userId,
        tenantId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return !!session;
  }

  private async createSession(userId: string, tenantId: string, meta: RequestMeta) {
    const refreshToken = randomBytes(48).toString("hex");
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.getRefreshExpiresMs());

    const session = await this.prisma.client.authSession.create({
      data: {
        userId,
        tenantId,
        refreshTokenHash,
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return { ...session, refreshToken };
  }

  private async findValidSession(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    return this.prisma.client.authSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  private getAccessSecret(): string {
    const secret =
      this.config.get<string>("JWT_ACCESS_SECRET") ??
      (this.config.get<string>("NODE_ENV") === "production"
        ? undefined
        : "dev-access-secret-change-me-32chars-min");

    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is required in production");
    }

    return secret;
  }

  private async createAccessToken(payload: {
    userId: string;
    tenantId: string;
    sessionId: string;
    email: string;
  }) {
    return this.jwtService.signAsync(
      {
        sub: payload.userId,
        tenantId: payload.tenantId,
        sessionId: payload.sessionId,
        email: payload.email,
      },
      {
        secret: this.getAccessSecret(),
        expiresIn: this.config.get<string>("ACCESS_TOKEN_EXPIRES_IN", "15m") as `${number}m`,
      },
    );
  }

  private async buildUserResponse(
    userId: string,
    tenantId: string,
    permissions: string[],
  ): Promise<AuthUserResponse> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado.");
    }

    const [roles, groups] = await Promise.all([
      this.rbac.getUserRoles(userId, tenantId),
      this.rbac.getUserGroups(userId, tenantId),
    ]);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
      roles,
      groups,
      permissions,
    };
  }
}
