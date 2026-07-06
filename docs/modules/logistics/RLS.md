# RLS — Customer + CustomerBranch

Policies tenant isolation via `app.current_tenant_id`:

```sql
Customer_tenant_isolation
CustomerBranch_tenant_isolation
```

## Scripts

- Migration: `20260706140000_add_customers`
- Hardening: `packages/database/sql/security/07-customers-hardening.sql`
- Core enable: `03-enable-rls-core.sql` (atualizado)
- Teste: `05-test-rls-isolation.sql` (cenários 9–11)

## Runtime

FORCE RLS + usuário `nexum_app` ainda não ativos em dev local.

Produção permanece NO-GO até `pnpm security:rls:test` passar com `nexum_app`.
