# Padrões de API — Nexum Tower

Contrato único de request/response da API (Nexum Core Platform). Todo endpoint segue este formato.

## 1. Envelope de resposta (sucesso)

```json
{
  "success": true,
  "data": { "...": "..." },
  "meta": { "requestId": "uuid", "timestamp": "2026-07-03T12:00:00.000Z" }
}
```

Listas paginadas incluem `pagination`:

```json
{
  "success": true,
  "data": [ { "...": "..." } ],
  "pagination": { "page": 1, "perPage": 20, "total": 137, "totalPages": 7 },
  "meta": { "requestId": "uuid", "timestamp": "..." }
}
```

Implementação: `GlobalResponseInterceptor` (`apps/api/src/common/interceptors/response.interceptor.ts`). Quando um service retorna `{ items, total, page, perPage }` (`PaginatedResult`), o interceptor gera automaticamente o bloco `pagination`.

## 2. Envelope de erro

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos.", "details": ["email must be an email"] },
  "meta": { "requestId": "uuid", "timestamp": "..." }
}
```

Implementação: `GlobalExceptionFilter` (`apps/api/src/common/filters/http-exception.filter.ts`). Nunca expõe stack trace em produção.

### Códigos de erro

| HTTP | code |
|------|------|
| 400 | `BAD_REQUEST` / `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `UNPROCESSABLE_ENTITY` |
| 429 | `TOO_MANY_REQUESTS` |
| 500 | `INTERNAL_ERROR` |

## 3. Request ID

`RequestIdMiddleware` gera/propaga `x-request-id` em toda requisição e resposta. Reaproveitado no envelope (`meta.requestId`) e disponível para correlação de logs.

## 4. Compatibilidade com o frontend

O helper `apiRequest` (`apps/web/lib/api.ts`) **desembrulha `data` automaticamente** e extrai `error.message` em falhas. Nenhum call site precisa mudar — o envelope é transparente para o restante do frontend.

## 5. Paginação

- Query: `?page=1&perPage=20` (e `search` quando suportado).
- `perPage` máximo: 200.
- Endpoints legados de listagem **continuam retornando array completo** quando `page`/`perPage` não são enviados (ex.: `GET /users`, `GET /audit/logs?limit=50`).

## 6. Hardening

- **Helmet** aplicado globalmente.
- **CORS** com `credentials: true` e origem controlada por `WEB_ORIGIN`.
- **ValidationPipe** com `whitelist` + `forbidNonWhitelisted` (rejeita campos não declarados nos DTOs → sem mass assignment).
- **Rate limiting** via `ThrottlerGuard` (global 100/min; `POST /auth/login` 8/min).

## 7. Regras para novos endpoints

- [ ] Usar DTO com `class-validator` (nunca aceitar campos livres).
- [ ] Nunca aceitar `tenantId` do body/query — sempre `currentUser.tenantId`.
- [ ] Proteger com `@RequirePermissions(...)`.
- [ ] Auditar ações sensíveis via `AuditService` + catálogo `AuditAction`.
- [ ] Retornar `PaginatedResult` para listas potencialmente grandes.

Ver [SECURITY-GUARDRAILS.md](./SECURITY-GUARDRAILS.md).
