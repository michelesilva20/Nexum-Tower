import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { getRequestId } from "../middleware/request-id.middleware";

type ErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
};

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_ERROR",
};

/**
 * Padroniza todas as respostas de erro no envelope canônico:
 * `{ success: false, error: { code, message, details }, meta }`.
 * Nunca expõe stack trace em produção. Ver docs/API-STANDARDS.md.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === "production";

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let code = STATUS_CODE_MAP[status] ?? "ERROR";
    let message = "Erro interno do servidor.";
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === "string") {
        message = payload;
      } else if (typeof payload === "object" && payload !== null) {
        const record = payload as Record<string, unknown>;
        const rawMessage = record.message;

        if (Array.isArray(rawMessage)) {
          // Erros de validação (class-validator) chegam como array de strings.
          code = "VALIDATION_ERROR";
          details = rawMessage;
          message = "Dados inválidos.";
        } else if (typeof rawMessage === "string") {
          message = rawMessage;
        }

        if (typeof record.error === "string" && code === "ERROR") {
          code = record.error.replace(/\s+/g, "_").toUpperCase();
        }
      }
    } else if (exception instanceof Error) {
      // Erro inesperado: loga internamente, resposta genérica em produção.
      this.logger.error(exception.message, exception.stack);
      if (!isProd) {
        message = exception.message;
      }
    }

    const body: ErrorBody = {
      success: false,
      error: { code, message, details },
      meta: {
        requestId: getRequestId(request) ?? "unknown",
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(body);
  }
}
