# Security Checklist — Nexum Core Platform

Checklist de revisão para todo PR que toca API, models ou dados de tenant. Complementa o [SECURITY-GUARDRAILS.md](./SECURITY-GUARDRAILS.md).

## Novo endpoint

- [ ] Protegido com `@RequirePermissions(...)` ou marcado `@Public()` conscientemente
- [ ] Body validado com DTO (`class-validator`); sem campos livres
- [ ] Não aceita `tenantId` do cliente — usa `currentUser.tenantId`
- [ ] Filtra/valida objetos pelo tenant (404 quando não pertence)
- [ ] Ações sensíveis auditadas com `AuditAction`
- [ ] Listas grandes retornam `PaginatedResult`
- [ ] Sem vazamento de segredos na resposta (hash de token, senha, etc.)

## Nova tabela / model

- [ ] Coluna `tenantId` NOT NULL + índice (se tenant-aware)
- [ ] Migration com `ENABLE ROW LEVEL SECURITY` + policy `USING`/`WITH CHECK`
- [ ] Relação de FK com `onDelete` adequado
- [ ] Seed idempotente atualizado (se aplicável)

## RBAC / permissões

- [ ] Novas permissões adicionadas ao catálogo (`seed-data/permissions.ts`)
- [ ] Wildcards de papéis (`users.*`, etc.) cobrem as novas chaves quando esperado
- [ ] Precedência DENY > ALLOW respeitada
- [ ] Papéis `isSystem` continuam protegidos

## Autenticação / sessão

- [ ] Cookies `httpOnly`; `secure`/`sameSite` conforme ambiente
- [ ] Refresh token só como hash; nunca exposto
- [ ] Expiração de cookie alinhada com expiração do token

## Frontend

- [ ] `PermissionGate` aplicado (UX), mas backend também protege
- [ ] Chamadas via `apiRequest` (envelope desembrulhado automaticamente)
- [ ] Nenhuma decisão de segurança feita apenas no cliente

## Antes de mergear

- [ ] `pnpm --filter api test` verde
- [ ] `pnpm lint` sem erros
- [ ] Migrations aplicam limpo (`prisma migrate deploy`)
- [ ] Documentação atualizada quando o contrato mudou

## Async / DLQ

Aplicar quando a feature usar filas, workers ou processamento em background:

- [ ] A feature executa tarefa assíncrona?
- [ ] A feature depende de serviço externo?
- [ ] A feature precisa de fila?
- [ ] A feature precisa de retry?
- [ ] A feature precisa de backoff?
- [ ] A feature precisa de DLQ?
- [ ] A feature precisa de Outbox Pattern?
- [ ] O job é idempotente?
- [ ] O payload contém tenantId?
- [ ] O payload evita dados sensíveis?
- [ ] O job gera AuditLog?
- [ ] Existe forma de observar falhas?
- [ ] Existe forma futura de reprocessar?
- [ ] Existe permissão para reprocessamento manual?
- [ ] Existe feature flag ou setting relacionado?

Documentos: [ASYNC-JOBS.md](./ASYNC-JOBS.md), [DLQ.md](./DLQ.md), [OUTBOX-PATTERN.md](./OUTBOX-PATTERN.md)
