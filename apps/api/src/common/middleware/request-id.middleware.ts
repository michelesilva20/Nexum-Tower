import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Garante um identificador único por requisição, reutilizado pelo
 * GlobalResponseInterceptor, GlobalExceptionFilter e AuditService.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();

    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}

export function getRequestId(req: unknown): string | undefined {
  if (typeof req === "object" && req !== null && "requestId" in req) {
    return (req as { requestId?: string }).requestId;
  }
  return undefined;
}
