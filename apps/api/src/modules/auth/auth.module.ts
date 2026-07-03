import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>("JWT_ACCESS_SECRET") ??
          (config.get<string>("NODE_ENV") === "production"
            ? undefined
            : "dev-access-secret-change-me-32chars-min");

        if (!secret) {
          throw new Error("JWT_ACCESS_SECRET is required in production");
        }

        return {
          secret,
          signOptions: {
            expiresIn: config.get<string>("ACCESS_TOKEN_EXPIRES_IN", "15m") as `${number}m`,
          },
        };
      },
    }),
    RbacModule,
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
