# Fase 1.0.2 — O que foi feito (Fechamento 10/10 de Filiais)

> **Documento explicativo** · julho/2026  
> **Escopo:** correção definitiva de `Branch.code`, E2E estável e documentação coerente  
> **Status:** concluído — **10/10 para desenvolvimento**

Este documento explica **em linguagem clara** o trabalho da **Fase 1.0.2**. Para o checklist técnico de entrega, consulte [FASE-1.0.2-FECHAMENTO.md](./FASE-1.0.2-FECHAMENTO.md). Para as fases anteriores, consulte [FASE-1.0-FILIAIS.md](./FASE-1.0-FILIAIS.md), [FASE-1.0.1-HARDENING.md](./FASE-1.0.1-HARDENING.md) e [FASE-1.0.1-O-QUE-FOI-FEITO.md](./FASE-1.0.1-O-QUE-FOI-FEITO.md).

---

## Contexto

As fases anteriores já tinham entregado Filiais funcional e hardened:

| Fase | Entrega |
|------|---------|
| **1.0** | Branch, UserBranchAccess, API, tela admin, seed, 71 testes |
| **1.0.1** | Migrations reproduzíveis, índices parciais, ABAC reforçado, 79 testes |

Porém, na revisão final antes de **Customers**, encontramos uma **contradição entre documentação e banco** no campo `code`, além de pendências de **E2E** e **RLS** que impediam classificar o módulo como 10/10 completo.

A **Fase 1.0.2** fechou essas lacunas — sem implementar Customers.

---

## O problema principal — Branch.code

### O que a documentação dizia

```txt
Filial soft-deleted NÃO pode reutilizar o mesmo code.
```

### O que o banco permitia (Fase 1.0.1)

O índice parcial `Branch_tenantId_code_active_key` garantia unicidade **apenas entre filiais ativas** (`deletedAt IS NULL`).

Isso permitia, na prática:

```txt
Filial A: code = SANTOS, deletedAt = preenchido  (soft-deleted)
Filial B: code = SANTOS, deletedAt = null        (nova filial ativa)
```

Ou seja: a **decisão de negócio estava documentada**, mas **não estava garantida no PostgreSQL**.

### Decisão oficial adotada (Fase 1.0.2)

```txt
tenantId + code = único permanentemente
code NÃO pode ser reutilizado após soft delete
```

**Motivos:** auditoria, integrações futuras, documentos, relatórios, referência operacional e ausência de ambiguidade histórica.

### Regra diferente para documentNumber

| Campo | Significado | Regra |
|-------|-------------|--------|
| **code** | Identidade operacional permanente | Único por tenant em **todos** os registros |
| **documentNumber** | Dado fiscal/administrativo (opcional) | Único entre filiais **ativas** quando informado; múltiplos NULL permitidos |

Essa distinção ficou documentada de forma explícita para evitar confusão futura.

---

## O que foi feito

### 1. Pré-check de duplicidade

Antes de alterar o índice, criamos um diagnóstico para detectar conflitos existentes:

```bash
pnpm db:check:branch-code-duplicates
```

**Script:** `packages/database/scripts/check-branch-code-duplicates.ts`  
**SQL alternativo:** `packages/database/sql/diagnostics/branch-code-duplicates.sql`

**Resultado nesta sessão:** nenhuma duplicidade encontrada → migration aplicada com segurança.

Se houvesse duplicidades, o procedimento seria **parar**, documentar e corrigir manualmente — **sem apagar dados silenciosamente**.

---

### 2. Migration e banco

**Nova migration:** `20260706120000_branch_code_permanent_unique`

- Remove o índice parcial `Branch_tenantId_code_active_key`
- Cria o índice permanente `Branch_tenantId_code_key`
- Atualiza o schema Prisma com `@@unique([tenantId, code])`

**Índices finais de Branch:**

| Índice | Proteção |
|--------|----------|
| `Branch_tenantId_code_key` | Code único **permanentemente** por tenant |
| `Branch_one_headquarters_per_tenant_idx` | Uma matriz ativa por tenant |
| `Branch_tenantId_documentNumber_active_key` | Documento único entre ativos |

Script idempotente atualizado: `packages/database/sql/security/06-branches-hardening.sql`

---

### 3. Backend (API)

Arquivo: `apps/api/src/modules/branches/branches.service.ts`

**Alterações:**

- `assertUniqueCode` passou a verificar **todos** os registros do tenant, incluindo soft-deleted
- Mensagem amigável quando há conflito:
  > *"Não é possível reutilizar este código de filial. Ele já foi usado neste tenant."*
- `assertUniqueDocument` manteve filtro `deletedAt IS NULL` (regra diferente de `code`)

**Novos testes** em `branches.service.spec.ts`:

- Bloqueia create com code já usado (inclui soft-deleted)
- Permite mesmo code em tenants diferentes
- Bloqueia update para code já usado
- Confirma que soft delete não libera code

**Total na API:** **82/82** testes passando (antes: 79).

---

### 4. Frontend

Tela `/app/admin/branches` — **sem redesign**.

Comportamento validado:

- Erro de code duplicado aparece no **toast** com mensagem da API
- Modal **permanece aberto** em caso de erro
- Estado `submitting` finaliza corretamente no `finally`

---

### 5. Seed e permissões

O usuário demo `operador@nexumtower.local` (role `logistics-operator`) precisava de `branches.read` para acessar a listagem com escopo limitado a Botucatu.

**Alteração:** `packages/database/prisma/seed-data/permissions.ts` — adicionado `branches.read` e `organization.read` ao role `logistics-operator`.

Isso alinha o seed com o cenário de negócio: operador de filial vê **apenas** a unidade vinculada.

---

### 6. E2E Playwright — estabilizado ✅ 7/7

A Fase 1.0.1 deixou E2E pendente (timeout no webServer). Nesta fase:

**Problemas encontrados e corrigidos:**

| Problema | Correção |
|----------|----------|
| WebServer sem migrate/seed | Script `pnpm dev:e2e` |
| Login clicava em "Sign in with SSO" | Submit do `<form>` em vez de regex `/sign in/i` |
| Locators ambíguos (`getByText('MATRIZ')`) | `span.font-mono` com match exato do code |
| Browsers Playwright ausentes | Script `pnpm test:e2e:install` |
| Login flaky na 1ª execução | Retry até 3 tentativas no helper |

**Arquivos alterados:**

- `playwright.config.ts` — `dev:e2e`, timeout 300s, locale pt-BR
- `tests/e2e/helpers/auth.ts` — login robusto
- `tests/e2e/branches.spec.ts` — locators e cenários

**Cenários cobertos (7 testes):**

- Admin vê menu e listagem (MATRIZ, SANTOS)
- Admin vê botão Nova filial
- Viewer sem permissão → menu oculto + access denied
- `operacao@` → SANTOS + PARANAGUA apenas
- `operador@` → BOTUCATU apenas
- Usuários limitados não veem botão criar

---

### 7. RLS

Scripts de RLS já existiam desde a Fase 1.0. A Fase 1.0.2 **documentou o procedimento reproduzível**:

```bash
pnpm security:rls:test          # host com psql
pnpm security:rls:test:docker   # via container PostgreSQL
```

**Status local (Windows):** `psql` ausente, Docker parado → teste **não executado** nesta máquina.

**Classificação:**

- ✅ Scripts prontos + procedimento documentado em [RLS.md](./modules/organization/RLS.md)
- ⚠️ Pendência **não bloqueia desenvolvimento**
- ❌ Pendência **bloqueia produção** até FORCE RLS + `nexum_app` + teste real

---

### 8. Documentação

Arquivos criados ou atualizados:

| Documento | Conteúdo |
|-----------|----------|
| [FASE-1.0.2-FECHAMENTO.md](./FASE-1.0.2-FECHAMENTO.md) | Entrega técnica |
| [FASE-1.0.2-O-QUE-FOI-FEITO.md](./FASE-1.0.2-O-QUE-FOI-FEITO.md) | Este documento |
| [BRANCHES.md](./modules/organization/BRANCHES.md) | Regras de code/documentNumber |
| [MIGRATIONS.md](./modules/organization/MIGRATIONS.md) | Migration 1.0.2 + pré-check |
| [RLS.md](./modules/organization/RLS.md) | Procedimento RLS reproduzível |
| [GO-NO-GO-LOGISTICS-CORE.md](./GO-NO-GO-LOGISTICS-CORE.md) | GO dev / NO-GO prod |
| [PANORAMA-ATUAL.md](./PANORAMA-ATUAL.md) | Camada Organizacional Filiais 10/10 |

Também adicionada nota de correção nos docs da Fase 1.0.1 (documentação correta, banco inconsistente — corrigido na 1.0.2).

---

## Arquivos de código

### Criados

```
packages/database/prisma/migrations/20260706120000_branch_code_permanent_unique/
packages/database/scripts/check-branch-code-duplicates.ts
packages/database/sql/diagnostics/branch-code-duplicates.sql
docs/FASE-1.0.2-FECHAMENTO.md
docs/FASE-1.0.2-O-QUE-FOI-FEITO.md
```

### Alterados

```
packages/database/prisma/schema.prisma
packages/database/sql/security/06-branches-hardening.sql
apps/api/src/modules/branches/branches.service.ts
apps/api/src/modules/branches/branches.service.spec.ts
packages/database/prisma/seed-data/permissions.ts
playwright.config.ts
tests/e2e/helpers/auth.ts
tests/e2e/branches.spec.ts
package.json
docs/modules/organization/*.md
docs/GO-NO-GO-LOGISTICS-CORE.md
docs/PANORAMA-ATUAL.md
```

---

## Validação executada

| Comando | Resultado |
|---------|-----------|
| `pnpm db:check:branch-code-duplicates` | ✅ OK |
| `pnpm db:migrate:deploy` | ✅ OK |
| `pnpm db:seed` | ✅ OK |
| `pnpm typecheck` | ✅ OK |
| `pnpm lint` | ✅ OK |
| `pnpm test:api` | ✅ **82/82** |
| `pnpm build` | ✅ OK |
| `pnpm test:e2e` (branches) | ✅ **7/7** |
| `pnpm security:rls:test` | ❌ psql ausente no Windows |

---

## Como rodar localmente

```bash
# Banco
pnpm db:migrate:deploy
pnpm db:seed

# Pré-check antes de migrations de code (opcional)
pnpm db:check:branch-code-duplicates

# Testes
pnpm test:api
pnpm test:e2e:install          # primeira vez
pnpm test:e2e -- tests/e2e/branches.spec.ts

# Stack completa para E2E manual
pnpm dev:e2e
```

---

## Pendências conhecidas

1. **RLS runtime** — FORCE RLS + role `nexum_app` em staging/prod
2. **`pnpm security:rls:test`** — executar em ambiente Linux/CI ou com Docker
3. **E2E CRUD completo** — criar/editar/desativar filial no Playwright (desejável, não bloqueante)

Nenhuma pendência bloqueia o início de **Customers**.

---

## GO / NO-GO

| Contexto | Decisão |
|----------|---------|
| **Iniciar Fase 1.1 — Customers + CustomerBranch** | ✅ **GO** |
| **Deploy em produção** | ⚠️ **NO-GO** até RLS runtime validado |

---

## Conclusão

A **Fase 1.0.2** alinhou **documentação, banco, API, testes e E2E** na regra definitiva de `Branch.code`:

```txt
code = identidade operacional permanente, não reutilizável após soft delete
```

O módulo **Nexum Organizational Branches** está classificado como:

```txt
10/10 para desenvolvimento
```

A próxima fase recomendada é:

```txt
Nexum Logistics Core — Fase 1.1
Customers + CustomerBranch
```

Arquitetura preferencial: `Customer` global do tenant + vínculo `CustomerBranch` por filial (não `Customer.branchId` simples).

---

## Documentação relacionada

- [FASE-1.0-FILIAIS.md](./FASE-1.0-FILIAIS.md) — implementação original
- [FASE-1.0.1-O-QUE-FOI-FEITO.md](./FASE-1.0.1-O-QUE-FOI-FEITO.md) — hardening técnico
- [FASE-1.0.2-FECHAMENTO.md](./FASE-1.0.2-FECHAMENTO.md) — checklist de entrega
- [modules/organization/README.md](./modules/organization/README.md) — módulo organizacional
