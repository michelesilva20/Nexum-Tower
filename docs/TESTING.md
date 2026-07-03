# Testing — Nexum Tower

Estratégia de testes da plataforma.

---

## Testes existentes (61 testes — 10 suites)

| Pacote | Ferramenta | Cobertura atual |
|--------|------------|-----------------|
| `apps/api` | Jest | Auth, sessions, RBAC, ABAC, tenant isolation, settings, features, audit, runWithTenant |
| `apps/web` | Playwright | Login admin/viewer, menus, access denied, logout |

Comandos:

```bash
pnpm test:api          # 61 testes unitários
pnpm test:e2e          # Playwright (requer db:seed)
pnpm security:rls:test # Teste manual RLS (requer nexum_app)
```

Detalhes E2E: [E2E-TESTING.md](./E2E-TESTING.md)

### Suites unitárias API

| Arquivo | Cobertura |
|---------|-----------|
| `auth.service.spec.ts` | Login, logout, refresh inválido |
| `auth.sessions.spec.ts` | Listar, revogar, logout-all |
| `permissions.guard.spec.ts` | 401/403, rota pública |
| `rbac.service.spec.ts` | Role, grupo, ALLOW/DENY, DENY > ALLOW |
| `authorization.service.spec.ts` | ABAC, roles de sistema |
| `tenant-isolation.spec.ts` | Cross-tenant bloqueado |
| `settings.service.spec.ts` | List, update, sensível, validação tipo, audit |
| `features.service.spec.ts` | List, toggle, audit |
| `audit.service.spec.ts` | Log, paginação, tenant filter |
| `tenant-context.spec.ts` | runWithTenant rejeita tenantId vazio |

---

## Como rodar os testes

```bash
# Todos os testes da API
pnpm --filter api test

# Em modo watch
pnpm --filter api test:watch

# Com coverage (se configurado)
pnpm --filter api test -- --coverage

# Filtrar por arquivo
pnpm --filter api test -- --testPathPattern=rbac
pnpm --filter api test -- --testPathPattern=tenant-isolation
pnpm --filter api test -- --testPathPattern=sessions
```

---

## Testes de Isolamento RLS (manual)

```bash
# Scripts em packages/database/sql/security/
pnpm security:rls:test

# Ou manualmente:
psql "%DATABASE_URL_APP_USER%" -f packages/database/sql/security/05-test-rls-isolation.sql
```

Ver [RLS-HARDENING.md](./RLS-HARDENING.md) e [packages/database/sql/security/README.md](../packages/database/sql/security/README.md).

---

## Playwright E2E

Implementado em `tests/e2e/core-platform.spec.ts`. Ver [E2E-TESTING.md](./E2E-TESTING.md).

---

## Cobertura esperada ao implementar novos módulos

Para cada novo módulo operacional (trips, customers, etc.), criar:

```text
[ ] unit test: criação com tenantId correto
[ ] unit test: acesso cross-tenant rejeitado (ForbiddenException)
[ ] unit test: permissão necessária (PermissionsGuard)
[ ] unit test: audit log gerado nas operações sensíveis
[ ] e2e: fluxo crítico funciona para usuário com permissão
[ ] e2e: acesso negado para usuário sem permissão
```

---

## Notas importantes

- Testes unitários **não requerem banco de dados** — usam mocks
- Testes de integração com banco requerem `DATABASE_URL` e migrations aplicadas
- O CI roda testes unitários + build; E2E roda em push para `main` (ver [CI-CD.md](./CI-CD.md))
- Nunca commitar testes que dependem de banco sem service container no CI
