# Organization — Migrations

## Histórico Branches

| Migration | Conteúdo |
|-----------|----------|
| `20260705100000_add_branches` | Enums, tabelas, FKs, RLS policies |
| `20260705110000_branches_hardening` | Índices parciais (matriz, code ativo, documentNumber) |
| `20260706120000_branch_code_permanent_unique` | **code permanente** — `tenantId + code` único em todos os registros |

## Pré-check antes de migration de code

```bash
pnpm db:check:branch-code-duplicates
```

Script: `packages/database/scripts/check-branch-code-duplicates.ts`  
SQL: `packages/database/sql/diagnostics/branch-code-duplicates.sql`

Se retornar duplicidades: **não** aplicar migration; corrigir manualmente.

## Baseline e reprodutibilidade

### CI / banco limpo (oficial)

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

O CI (`.github/workflows/ci.yml`) usa exatamente este fluxo.

### Dev local — divergência conhecida

Se o schema foi aplicado anteriormente via `prisma db push` **sem** registrar a migration:

```bash
pnpm --filter database exec prisma migrate resolve --applied 20260705100000_add_branches
pnpm db:migrate:deploy
```

**Baseline adotado:** migrations versionadas são fonte de verdade; `db push` **não** faz parte do fluxo oficial.

## Reparo manual de índices

Script idempotente:

```bash
psql "%DATABASE_URL%" -f packages/database/sql/security/06-branches-hardening.sql
```

## Decisões de índice (Fase 1.0.2)

| Campo | Índice | Regra |
|-------|--------|--------|
| **code** | `Branch_tenantId_code_key` | Único **permanentemente** por tenant (inclui soft-deleted) |
| **matriz** | `Branch_one_headquarters_per_tenant_idx` | Uma matriz ativa por tenant |
| **documentNumber** | `Branch_tenantId_documentNumber_active_key` | Único entre **ativos** quando informado |

Ver [FASE-1.0.2-FECHAMENTO.md](../../FASE-1.0.2-FECHAMENTO.md).
