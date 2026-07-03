# Auditoria — Nexum Tower

Trilha de auditoria de ações sensíveis, isolada por tenant.

## 1. Modelo

`AuditLog` (`packages/database/prisma/schema.prisma`): `tenantId`, `userId?`, `action`, `entity?`, `entityId?`, `metadata?` (JSON), `ipAddress?`, `userAgent?`, `createdAt`.

## 2. Catálogo de ações

Fonte única: `apps/api/src/common/audit-actions.ts` (`AuditAction`). Toda ação sensível usa uma destas constantes.

| Grupo | Ações |
|-------|-------|
| Sessão | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `LOGOUT_ALL`, `SESSION_REVOKED`, `TOKEN_REFRESH` |
| Usuários | `USER_CREATED`, `USER_UPDATED`, `USER_DISABLED`, `USER_DELETED`, `USER_ROLE_ADDED/REMOVED`, `USER_GROUP_ADDED/REMOVED`, `USER_PERMISSION_OVERRIDE_ADDED/REMOVED` |
| Grupos | `GROUP_CREATED`, `GROUP_UPDATED`, `GROUP_DELETED`, `GROUP_ROLE_ADDED/REMOVED` |
| Papéis | `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`, `ROLE_PERMISSION_ADDED/REMOVED` |
| Config | `SETTING_UPDATED`, `FEATURE_FLAG_UPDATED` |
| Autorização | `PERMISSION_DENIED`, `ACCESS_DENIED_OBJECT`, `RLS_CONTEXT_ERROR` |

Alterações de valor (settings/features/overrides) registram `oldValue`/`newValue` (ou `oldEnabled`/`newEnabled`) em `metadata`.

## 3. Consulta

`GET /audit` (e alias legado `GET /audit/logs`) — permissão `audit.read`.

Filtros: `action`, `entity`, `userId`, `dateFrom` (ISO), `dateTo` (ISO).

Paginação: `page` + `perPage`. Sem paginação, retorna array (padrão `limit=50`, máx. 200) — comportamento legado preservado.

`GET /audit/:id` — detalhe de um registro do tenant.

## 4. Isolamento

Todas as consultas filtram por `currentUser.tenantId`. A tabela também tem policy de RLS (ver [RLS.md](./RLS.md)).

## 5. Boas práticas

- Auditar **depois** de a ação ter efeito.
- Nunca registrar segredos (senha, token) em `metadata`.
- Preferir `entity` + `entityId` para permitir rastrear o alvo.
