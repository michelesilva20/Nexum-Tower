# RLS Hardening — Nexum Tower

> **Antes de criar qualquer módulo operacional, consulte este documento e o `SECURITY-GUARDRAILS.md`.**

## 1. Estado atual do RLS

| Item | Status |
|------|--------|
| `ENABLE ROW LEVEL SECURITY` nas tabelas core | ✅ Ativo |
| `CREATE POLICY` baseado em `app.current_tenant_id` | ✅ Ativo |
| `FORCE ROW LEVEL SECURITY` | ⚠️ Desativado (ver seção 6) |
| Usuário PostgreSQL restrito (`app_user`) | 📋 Documentado neste arquivo |
| `runWithTenant` utility | ✅ Implementado |

### Tabelas protegidas por RLS

| Tabela | ENABLE RLS | POLICY criada |
|--------|------------|---------------|
| `User` | ✅ | ✅ `tenant_isolation` |
| `Group` | ✅ | ✅ `tenant_isolation` |
| `GroupMember` | ✅ | ✅ `tenant_isolation` |
| `UserRole` | ✅ | ✅ `tenant_isolation` |
| `GroupRole` | ✅ | ✅ `tenant_isolation` |
| `UserPermissionOverride` | ✅ | ✅ `tenant_isolation` |
| `AuthSession` | ✅ | ✅ `tenant_isolation` |
| `AuditLog` | ✅ | ✅ `tenant_isolation` |
| `TenantSetting` | ✅ | ✅ `tenant_isolation` |
| `TenantFeature` | ✅ | ✅ `tenant_isolation` |

### Tabelas ainda não avaliadas (módulos operacionais futuros)

> Ao criar qualquer tabela nova com `tenantId`, siga o checklist da seção 8.

- `Customer`, `Driver`, `Vehicle`, `Route`, `Trip`, `Incident`, `Cost`, `Document` — ainda não criados.

---

## 2. Mecanismo de funcionamento

O RLS funciona via variável de sessão PostgreSQL definida antes de cada query:

```sql
SELECT set_config('app.current_tenant_id', 'tenant-uuid', true);
```

As policies usam essa variável:

```sql
POLICY tenant_isolation ON "User"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
```

### Utilitário `runWithTenant`

```typescript
import { runWithTenant } from "database";

await runWithTenant("tenant-abc", async (tx) => {
  return tx.user.findMany(); // RLS filtra por tenant quando nexum_app + FORCE RLS
});
```

Implementação: `packages/database/src/tenant-context.ts`

---

## 3. Scripts SQL de hardening

Pasta canônica: **`packages/database/sql/security/`**

| Script | Função |
|--------|--------|
| `01-create-roles.sql` | Cria `nexum_migrator` e `nexum_app` |
| `02-grant-app-user.sql` | Grants mínimos para runtime |
| `03-enable-rls-core.sql` | RLS + policies (idempotente) |
| `04-force-rls-core.sql` | FORCE RLS (staging/prod) |
| `05-test-rls-isolation.sql` | Teste manual de isolamento |

```bash
pnpm security:rls:test
```

Ver [packages/database/sql/security/README.md](../packages/database/sql/security/README.md).

---

## 4. Usuário PostgreSQL restrito (`nexum_app`)

### Por que usar um usuário restrito?

- O usuário `SUPERUSER` e `BYPASSRLS` ignoram todas as policies RLS.
- Em produção, a API deve conectar com um usuário **sem** esses privilégios.
- Isso garante que qualquer query esquecida sem `runWithTenant` falha seguramente.

### Script de criação

Use os scripts automatizados em `packages/database/sql/security/` (preferido) ou:

```sql
-- Ver 01-create-roles.sql e 02-grant-app-user.sql
```

### Configuração de ambiente

```env
# .env.production
# Migrator (usado pelo Prisma migrate deploy)
DATABASE_URL=postgresql://nexum_migrator:migrator-secret@host:5432/nexum_tower

# App user (usado pela API em runtime)
DATABASE_URL_APP=postgresql://nexum_app:app-secret@host:5432/nexum_tower
```

---

## 4. Como usar `runWithTenant`

### Padrão correto em controllers/services

```typescript
import { runWithTenant } from "database";

async listUsers(tenantId: string) {
  return runWithTenant(tenantId, async (tx) => {
    return tx.user.findMany({ where: { status: "ACTIVE" } });
  });
}
```

---

## 5. Como testar isolamento de tenant

### Script SQL manual

```bash
pnpm security:rls:test
# ou: psql $DATABASE_URL_APP_USER -f packages/database/sql/security/05-test-rls-isolation.sql
```

### Testes unitários ABAC (já implementados)

Os testes em `apps/api/src/modules/authorization/tenant-isolation.spec.ts` validam
a camada `AuthorizationService` que impede acesso cross-tenant na camada de aplicação.

```bash
pnpm --filter api test --testPathPattern=tenant-isolation
```

---

## 6. FORCE ROW LEVEL SECURITY

### O que é

`FORCE ROW LEVEL SECURITY` faz com que **até mesmo o owner da tabela** seja
submetido às policies RLS. Sem `FORCE RLS`, o usuário que criou a tabela pode
bypassa-la mesmo sem `BYPASSRLS`.

### Por que não está ativo por padrão

1. Em desenvolvimento, o Prisma usa o usuário de migrations (que é owner). Ativar
   `FORCE RLS` quebraria todas as queries locais sem `runWithTenant`.
2. `prisma migrate dev` usa o owner e precisa criar/alterar tabelas.
3. `prisma db seed` usa o owner e precisa inserir dados de múltiplos tenants.

### Como ativar em produção

Após criar o `nexum_app` e usar apenas ele na API:

```sql
-- Ativar FORCE RLS nas tabelas (somente após configurar nexum_app)
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Group" FORCE ROW LEVEL SECURITY;
ALTER TABLE "GroupMember" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserRole" FORCE ROW LEVEL SECURITY;
ALTER TABLE "GroupRole" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserPermissionOverride" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuthSession" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TenantSetting" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TenantFeature" FORCE ROW LEVEL SECURITY;
```

### Riscos conhecidos

- Se algum serviço conectar como owner sem `runWithTenant`, receberá erro de RLS.
- Jobs de background, cron jobs e scripts de manutenção precisam usar `runWithTenant`
  ou conectar como `nexum_migrator` explicitamente.

---

## 7. Riscos conhecidos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Query sem `runWithTenant` retorna dados cross-tenant | Usar `nexum_app` em produção + `FORCE RLS` |
| Prisma não suporta variáveis de sessão em pool de conexões | Usar `$executeRaw` no `runWithTenant` (implementado) |
| Seed com múltiplos tenants bypassa RLS | Seed roda como migrator/owner, comportamento esperado |
| Novo módulo esquece de usar `runWithTenant` | Code review + checklist abaixo |

---

## 8. Checklist antes de criar novas tabelas

```text
[ ] A tabela tem coluna tenantId?
[ ] O model Prisma inclui tenantId como campo obrigatório?
[ ] Foi adicionado ENABLE ROW LEVEL SECURITY na migration?
[ ] Foi criada POLICY de isolamento baseada em app.current_tenant_id?
[ ] O controller usa runWithTenant ou AuthorizationService.assertSameTenant?
[ ] Os testes cobrem acesso cross-tenant (deve falhar)?
[ ] A tabela foi adicionada a este documento na seção "Tabelas protegidas"?
```

---

## 9. Próximos passos (produção)

1. Criar usuário `nexum_app` e `nexum_migrator` no banco de produção.
2. Configurar `DATABASE_URL` da API para usar `nexum_app`.
3. Ativar `FORCE ROW LEVEL SECURITY` nas tabelas protegidas.
4. Executar `rls-test.sql` para validar isolamento.
5. Monitorar logs de erro de RLS nas primeiras semanas.
