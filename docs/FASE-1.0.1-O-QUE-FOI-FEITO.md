# Fase 1.0.1 — O que foi feito (Hardening de Filiais)

> **Documento explicativo** · julho/2026  
> **Escopo:** auditoria técnica e fortalecimento da implementação de Filiais  
> **Status:** concluído — base pronta para a Fase 1.1 (Customers)

Este documento explica **em linguagem clara** o trabalho realizado na **Fase 1.0.1**. Para o checklist técnico de entrega, consulte [FASE-1.0.1-HARDENING.md](./FASE-1.0.1-HARDENING.md). Para a implementação original de filiais, consulte [FASE-1.0-FILIAIS.md](./FASE-1.0-FILIAIS.md).

---

## Contexto

A **Fase 1.0** entregou o módulo de Filiais com sucesso:

- Models `Branch` e `UserBranchAccess`
- API REST completa (`/branches`)
- Permissões RBAC e escopo ABAC por filial
- Tela admin `/app/admin/branches`
- Seed demo com 5 filiais
- 71 testes unitários passando
- Build e typecheck OK

Porém, antes de avançar para **Customers** (próximo cadastro logístico), era necessário elevar a implementação de filiais para **padrão enterprise 10/10** — garantindo que migrations, banco, segurança e testes estivessem sólidos o suficiente para servir de base dos próximos módulos.

A **Fase 1.0.1** foi exatamente essa: uma **auditoria técnica + correções + documentação**, sem implementar Customers nem nenhum outro módulo logístico.

---

## Por que o hardening era necessário

A Fase 1.0 funcionava, mas a auditoria encontrou **lacunas entre o que o código prometia e o que o banco realmente garantia**:

| Lacuna | Risco |
|--------|-------|
| Migrations não reproduzíveis em banco limpo | CI e novos ambientes quebrariam |
| Matriz única só no service | Concorrência ou bypass poderia criar duas matrizes |
| Unicidade de `code`/`documentNumber` incluía soft-deleted | Comportamento inconsistente entre API e banco |
| ABAC incompleto em operações de escrita | Usuário com escopo limitado poderia alterar filiais |
| Poucos testes de segurança | Regressões futuras passariam despercebidas |
| E2E e RLS não validados | Comportamento real em produção incerto |

Sem corrigir isso, cada novo módulo (Customers, Viagens, etc.) herdaria uma base frágil.

---

## O que encontramos na auditoria

### 1. Migrations

O schema de filiais havia sido aplicado localmente via `prisma db push`, mas a migration `20260705100000_add_branches` **não estava registrada** na tabela `_prisma_migrations`. Resultado: `pnpm db:migrate:deploy` falhava em banco limpo ou CI.

### 2. Integridade de banco

- **Matriz única** (`isHeadquarters = true`): validada apenas no service, sem índice parcial no PostgreSQL.
- **Código da filial** (`tenantId + code`): índice Prisma `@@unique` incluía registros soft-deleted, enquanto o service filtrava `deletedAt IS NULL`.
- **Documento** (`tenantId + documentNumber`): mesma divergência.

### 3. ABAC (controle de acesso por filial)

A leitura de filiais já respeitava `UserBranchAccess`, mas operações de **criação, edição, desativação e exclusão** não exigiam escopo global de forma consistente. Um usuário com `branches.update` e escopo limitado a uma filial poderia, em teoria, alterar metadados de outras filiais se tivesse a permissão RBAC.

### 4. UserBranchAccess

As validações de tenant estavam corretas na maior parte, mas faltava validação explícita `assertBranchBelongsToTenant` nas operações de vincular/remover usuário.

### 5. O que já estava correto

- Isolamento por tenant via JWT (sem aceitar `tenantId` do frontend)
- AuditLog nos eventos de filial
- PermissionGate no frontend
- RLS policies criadas na migration original
- Constraint única em `UserBranchAccess` (sem duplicidade)

---

## O que foi feito

### 1. Migrations — reprodutibilidade

**Problema resolvido:** banco limpo agora sobe sem depender de `db push`.

**Ações:**

1. Registramos a migration original como aplicada:
   ```bash
   pnpm --filter database exec prisma migrate resolve --applied 20260705100000_add_branches
   ```
2. Criamos a migration de hardening:
   ```
   packages/database/prisma/migrations/20260705110000_branches_hardening/
   ```
3. Documentamos o procedimento oficial em [modules/organization/MIGRATIONS.md](./modules/organization/MIGRATIONS.md).

**Fluxo canônico (CI, staging, banco limpo):**

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

> **Importante:** `db push` não faz parte do fluxo oficial. Use apenas para diagnóstico local.

---

### 2. Índices parciais no PostgreSQL

Criamos três índices que o Prisma não consegue expressar nativamente com soft delete:

| Índice | Regra |
|--------|-------|
| `Branch_one_headquarters_per_tenant_idx` | Apenas **uma matriz ativa** por tenant |
| `Branch_tenantId_code_active_key` | `code` único entre filiais **ativas** |
| `Branch_tenantId_documentNumber_active_key` | `documentNumber` único entre ativas (quando informado) |

Todos consideram `deletedAt IS NULL`.

**Script SQL adicional:** `packages/database/sql/security/06-branches-hardening.sql`

**Decisões documentadas:**

- **Matriz:** protegida no banco **e** no service (transação desmarca outras ao promover uma nova).
- **Código:** filial soft-deleted **não pode reutilizar** o mesmo `code` — preserva histórico para auditoria e integrações futuras. **Corrigido em banco na Fase 1.0.2** (`Branch_tenantId_code_key` permanente).
- **Documento:** opcional; múltiplos `NULL` permitidos; quando informado, único entre ativas.

**Schema Prisma:** removemos `@@unique` simples e mantivemos `@@index` + índices parciais via SQL.

---

### 3. ABAC reforçado na API

Ajustamos `apps/api/src/modules/branches/branches.service.ts` para aplicar escopo de forma rigorosa:

| Operação | Quem pode executar |
|----------|-------------------|
| `GET /branches`, `GET /branches/:id` | Escopo **global** **ou** vínculo em `UserBranchAccess` |
| `POST`, `PATCH`, `DELETE`, disable, enable | Apenas escopo **global** (`branches.manage`, `organization.manage`, `*`) |
| Vincular/remover usuário | Escopo global **ou** acesso à filial + `branches.assign_users` |

**Regras de negócio reforçadas:**

- `tenantId` sempre vem do JWT — nunca do body da requisição
- Busca por ID usa `id + tenantId`
- Usuário de outro tenant nunca acessa filial
- Usuário sem vínculo não acessa filial individual
- Soft delete de matriz limpa `isHeadquarters: false`

**Usuários demo e escopo esperado:**

| Usuário | Filiais visíveis |
|---------|------------------|
| `admin@nexumtower.local` (owner) | Todas |
| `operacao@nexumtower.local` | Santos + Paranaguá |
| `operador@nexumtower.local` | Botucatu |
| Usuário sem vínculo | Nenhuma (exceto escopo global) |

---

### 4. UserBranchAccess — segurança

Reforçamos as operações de vincular e remover usuários:

- Validação explícita de que branch e user pertencem ao **mesmo tenant** do usuário logado
- Bloqueio de duplicidade (`tenantId + userId + branchId`)
- Exigência de permissão `branches.assign_users`
- AuditLog em `BRANCH_USER_ASSIGNED` e `BRANCH_USER_REMOVED`

---

### 5. Wildcard `*` — revisão e documentação

O role `owner` recebe permissão `*` via RBAC. A auditoria confirmou:

| Pergunta | Resposta |
|----------|----------|
| `*` dá acesso à plataforma inteira? | **Não** — escopo limitado ao **tenant** do JWT |
| Existe Platform Admin separado? | **Não implementado** hoje |
| Há risco imediato? | Baixo — guards usam `currentUser.tenantId` |

**Recomendação futura (não implementada):** separar prefixos `platform.*`, `tenant.*`, `organization.*` — documentado em [PERMISSIONS.md](./modules/organization/PERMISSIONS.md).

---

### 6. RLS (Row Level Security)

As policies de tenant isolation em `Branch` e `UserBranchAccess` já existiam. O hardening:

- Estendeu o script de teste `05-test-rls-isolation.sql` (seções 6–8)
- Criou script complementar `06-branches-hardening.sql`
- Documentou pendência: **FORCE RLS + role `nexum_app`** ainda não ativos em dev local (decisão canônica do projeto)

---

### 7. Testes

**Backend — expandidos de forma significativa:**

- Arquivo: `apps/api/src/modules/branches/branches.service.spec.ts`
- **22 casos** cobrindo ABAC, cross-tenant, unicidade, audit, paginação
- **Total na API:** 79 testes passando (antes: 71)

**E2E Playwright — spec dedicado criado:**

- Arquivo: `tests/e2e/branches.spec.ts`
- Cenários: admin, viewer sem permissão, operacao (escopo limitado), operador (Botucatu)
- Usuários adicionados em `tests/e2e/helpers/auth.ts`

**Execução E2E nesta sessão:** falhou por timeout — webServer (API + Web) não subiu a tempo no ambiente Windows. Checklist manual documentado em [FASE-1.0.1-HARDENING.md](./FASE-1.0.1-HARDENING.md).

---

### 8. Documentação

Arquivos criados ou atualizados:

| Documento | Conteúdo |
|-----------|----------|
| [FASE-1.0.1-HARDENING.md](./FASE-1.0.1-HARDENING.md) | Entrega técnica e validação |
| [modules/organization/MIGRATIONS.md](./modules/organization/MIGRATIONS.md) | Procedimento de migrations |
| [modules/organization/BRANCHES.md](./modules/organization/BRANCHES.md) | Regras de negócio atualizadas |
| [modules/organization/USER-BRANCH-ACCESS.md](./modules/organization/USER-BRANCH-ACCESS.md) | Escopo e vínculos |
| [modules/organization/PERMISSIONS.md](./modules/organization/PERMISSIONS.md) | Permissões e wildcard |
| [modules/organization/RLS.md](./modules/organization/RLS.md) | Policies e scripts |
| [modules/organization/README.md](./modules/organization/README.md) | Índice do módulo |

---

## Arquivos de código alterados

### Criados

```
packages/database/prisma/migrations/20260705110000_branches_hardening/migration.sql
packages/database/sql/security/06-branches-hardening.sql
tests/e2e/branches.spec.ts
docs/FASE-1.0.1-HARDENING.md
docs/modules/organization/MIGRATIONS.md
docs/FASE-1.0.1-O-QUE-FOI-FEITO.md  ← este documento
```

### Alterados

```
packages/database/prisma/schema.prisma
apps/api/src/modules/branches/branches.service.ts
apps/api/src/modules/branches/branches.service.spec.ts
packages/database/sql/security/05-test-rls-isolation.sql
tests/e2e/helpers/auth.ts
docs/modules/organization/*.md
```

---

## Validação executada

| Comando | Resultado |
|---------|-----------|
| `pnpm db:migrate:deploy` | ✅ OK |
| `pnpm typecheck` | ✅ OK |
| `pnpm lint` | ✅ OK |
| `pnpm test:api` | ✅ **79/79** |
| `pnpm build` | ✅ OK |
| `pnpm test:e2e` | ❌ Timeout — stack dev não subiu a tempo |
| `pnpm security:rls:test` | ❌ `psql` ausente no Windows local |

---

## Pendências conhecidas

1. **E2E Playwright** — executar com API (`:3333`) + Web (`:3000`) + seed ativos
2. **RLS runtime** — ativar FORCE RLS + `nexum_app` em staging/prod
3. **E2E CRUD completo** — specs atuais cobrem listagem/escopo; criar/editar/vincular usuário ainda parcial

Nenhuma pendência bloqueia o início da Fase 1.1, mas devem ser resolvidas antes de go-live em produção.

---

## Recomendação para a próxima fase (Customers)

**Não implementado nesta fase.** Documentamos a arquitetura preferencial:

```txt
Customer       = entidade global do tenant (CNPJ único, histórico consolidado)
CustomerBranch = vínculo operacional cliente ↔ filial
```

**Evitar:** `Customer.branchId` obrigatório simples.

**Motivo:** um cliente pode operar em várias filiais (Santos + Paranaguá, por exemplo), sem duplicar CNPJ nem histórico.

---

## Conclusão

A **Fase 1.0.1** transformou a implementação de Filiais de “funcional” para **enterprise-ready**:

- Banco com integridade real (índices parciais)
- ABAC aplicado na API, não só no frontend
- Migrations reproduzíveis
- Testes ampliados (79 na API)
- Documentação completa e transparente sobre limitações

**Status:** ✅ **Liberado para iniciar Fase 1.1 — Customers + CustomerBranch**

---

## Documentação relacionada

- [FASE-1.0-FILIAIS.md](./FASE-1.0-FILIAIS.md) — implementação original
- [FASE-1.0.1-HARDENING.md](./FASE-1.0.1-HARDENING.md) — checklist técnico de entrega
- [modules/organization/README.md](./modules/organization/README.md) — módulo organizacional
- [PANORAMA-ATUAL.md](./PANORAMA-ATUAL.md) — visão geral do projeto
