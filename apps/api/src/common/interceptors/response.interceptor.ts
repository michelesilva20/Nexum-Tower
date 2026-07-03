import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { isPaginatedResult, type PaginatedResult } from "../pagination";
import { getRequestId } from "../middleware/request-id.middleware";

type ResponseMeta = {
  requestId: string;
  timestamp: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  meta: ResponseMeta;
};

/**
 * Envelopa toda resposta de sucesso no formato canônico da plataforma:
 * `{ success, data, meta }` (e `pagination` para listas paginadas).
 * Ver docs/API-STANDARDS.md.
 */
@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<unknown>> {
    const req = context.switchToHttp().getRequest<Request>();
    const meta: ResponseMeta = {
      requestId: getRequestId(req) ?? "unknown",
      timestamp: new Date().toISOString(),
    };

    return next.handle().pipe(
      map((payload: unknown) => {
        if (isPaginatedResult(payload)) {
          const paginated = payload as PaginatedResult<unknown>;
          const totalPages = paginated.perPage > 0 ? Math.ceil(paginated.total / paginated.perPage) : 0;

          return {
            success: true as const,
            data: paginated.items,
            pagination: {
              page: paginated.page,
              perPage: paginated.perPage,
              total: paginated.total,
              totalPages,
            },
            meta,
          };
        }

        return {
          success: true as const,
          data: payload ?? null,
          meta,
        };
      }),
    );
  }
}
