# Organization RLS

> Fechamento: [FASE-1.0.2-FECHAMENTO.md](../../FASE-1.0.2-FECHAMENTO.md)

## Status

Policies preparadas em:

- `packages/database/prisma/migrations/20260705100000_add_branches/migration.sql`
- `packages/database/sql/security/03-enable-rls-core.sql`
- `packages/database/sql/security/04-force-rls-core.sql`

## Tabelas

| Tabela | Policy |
|--------|--------|
| `Branch` | `Branch_tenant_isolation` |
| `UserBranchAccess` | `UserBranchAccess_tenant_isolation` |

Regra: `"tenantId" = current_setting('app.current_tenant_id', true)`

## Teste de isolamento

### Opção A — Host com `psql`

```bash
pnpm security:rls:test
```

Requer `DATABASE_URL_APP_USER` apontando para role `nexum_app` + FORCE RLS aplicado.

### Opção B — Docker

```bash
pnpm security:rls:test:docker
```

Adaptar nome do container (`nexum-postgres`) ao ambiente local.

### Opção C — CI (Linux)

O job `validate` em `.github/workflows/ci.yml` usa PostgreSQL 16. Para RLS runtime completo, executar manualmente em staging após:

1. `01-create-roles.sql`
2. `02-grant-app-user.sql`
3. `03-enable-rls-core.sql`
4. `04-force-rls-core.sql`
5. `pnpm security:rls:test`

Script: `packages/database/sql/security/05-test-rls-isolation.sql` (seções 6–8 = Branch/UserBranchAccess)

## Índices (hardening)

Script idempotente: `packages/database/sql/security/06-branches-hardening.sql`

## Pendências por ambiente

| Item | Dev local | Staging/Prod |
|------|-----------|--------------|
| ENABLE RLS | OK (migrations) | OK |
| FORCE RLS | Não ativo (postgres owner) | **Obrigatório** |
| `nexum_app` runtime | Não | **Obrigatório** |
| `pnpm security:rls:test` | Requer psql ou Docker | **Obrigatório antes de prod** |

**Classificação:** scripts prontos + procedimento reproduzível documentado. Pendência **não bloqueia dev**; **bloqueia produção**.
