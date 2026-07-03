import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthUserPayload } from "../../modules/auth/types/auth-user.type";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUserPayload }>();
    return request.user;
  },
);
