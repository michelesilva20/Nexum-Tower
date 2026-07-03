# Scripts SQL — Segurança RLS

Scripts para hardening do isolamento multi-tenant no PostgreSQL.

## Ordem de execução

| # | Arquivo | Quando usar |
|---|---------|-------------|
| 1 | `01-create-roles.sql` | Criar `nexum_migrator` e `nexum_app` |
| 2 | `02-grant-app-user.sql` | Grants mínimos para `nexum_app` |
| 3 | `03-enable-rls-core.sql` | Garantir RLS + policies (idempotente) |
| 4 | `04-force-rls-core.sql` | **Staging/prod** — FORCE RLS |
| 5 | `05-test-rls-isolation.sql` | Validar isolamento |

## Comandos rápidos

```bash
# Via psql (Linux/macOS)
psql "$DATABASE_URL" -f packages/database/sql/security/01-create-roles.sql
psql "$DATABASE_URL" -f packages/database/sql/security/02-grant-app-user.sql
psql "$DATABASE_URL" -f packages/database/sql/security/03-enable-rls-core.sql

# Teste de isolamento (como nexum_app)
psql "$DATABASE_URL_APP_USER" -f packages/database/sql/security/05-test-rls-isolation.sql

# Via pnpm (raiz do monorepo)
pnpm security:rls:test
```

## Windows (PowerShell)

```powershell
psql $env:DATABASE_URL -f packages/database/sql/security/01-create-roles.sql
psql $env:DATABASE_URL -f packages/database/sql/security/02-grant-app-user.sql
psql $env:DATABASE_URL -f packages/database/sql/security/03-enable-rls-core.sql
psql $env:DATABASE_URL_APP_USER -f packages/database/sql/security/05-test-rls-isolation.sql
```

## Variáveis de ambiente

Configure no `.env`:

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/nexum_tower?schema=public"
DATABASE_URL_APP_USER="postgresql://nexum_app:change_me_app_password@localhost:5432/nexum_tower?schema=public"
DATABASE_URL_MIGRATOR="postgresql://nexum_migrator:change_me_migrator_password@localhost:5432/nexum_tower?schema=public"
```

## Dev local vs produção

| Ambiente | Usuário DB | FORCE RLS |
|----------|------------|-----------|
| Dev (postgres owner) | `postgres` | ❌ Não aplicar (quebra queries sem contexto) |
| Staging/Prod | `nexum_app` | ✅ Aplicar script 04 |

Documentação completa: [docs/RLS-HARDENING.md](../../../docs/RLS-HARDENING.md)
