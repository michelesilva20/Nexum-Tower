# Fase 1.0 — Filiais (Branches)

> **Documento de entrega** · julho/2026  
> **Escopo:** camada organizacional multi-filial dentro do tenant  
> **Status:** implementado e validado (typecheck, lint API, 71 testes, build)

Este documento explica **o que foi feito**, **por quê**, **como usar** e **o que vem depois**. Para detalhes técnicos por área, consulte [docs/modules/organization/](./modules/organization/README.md).

---

## Contexto

O Nexum Tower já tinha o **Core Platform fechado em 10/10** (Auth, RBAC, ABAC, Admin UI, audit, CI, testes). Antes de iniciar cadastros logísticos (clientes, motoristas, viagens etc.), era necessário definir **como uma empresa cliente organiza suas unidades operacionais**.

A **Fase 1.0** implementa exatamente isso: **Filiais** dentro do tenant, com controle de acesso por unidade.

---

## Problema que resolve

Empresas de logística operam com múltiplas unidades — matriz, portos, bases regionais — mas continuam sendo **um único contrato SaaS** (um tenant).

Exemplo conceitual:

```txt
Tenant: Transmaion Transportes
Branches:
  - Matriz
  - Santos
  - Botucatu
  - Paranaguá
  - Rondonópolis
```

Sem filiais, todos os cadastros futuros ficariam “globais ao tenant”, sem escopo operacional. Com filiais, cada viagem, cliente, motorista etc. poderá (nas próximas fases) estar vinculado a uma **branchId**.

---

## Decisão arquitetural principal

| Conceito | Papel |
|----------|--------|
| **Tenant** | Fronteira forte de isolamento SaaS (multi-tenant) |
| **Branch** | Fronteira operacional **dentro** do tenant |

### O que NÃO foi feito (de propósito)

- **Não** transformamos filial em tenant (ex.: “Transmaion Santos” como tenant separado).
- **Não** criamos um segundo sistema de permissões paralelo ao RBAC/ABAC existente.
- **Não** implementamos módulos logísticos (viagens, frota, clientes etc.).

### Onde ficou cada coisa

| Camada | Decisão |
|--------|---------|
| API REST | `/branches` (mesmo padrão de `/groups`, `/users`) |
| Frontend | `/app/admin/branches` (grupo **Administração** no sidebar) |
| Soft delete | `deletedAt` + `status DISABLED` (padrão de entidades de longa vida) |
| Escopo ABAC | `UserBranchAccess` + permissões `branches.manage` / `organization.manage` / `*` |

---

## O que foi implementado

### 1. Banco de dados (Prisma + PostgreSQL)

**Novos models:**

- **`Branch`** — unidade operacional do tenant  
  Campos: `code`, `name`, `legalName`, documento, endereço, contato, `status`, `isHeadquarters`, `disabledAt`, `deletedAt`.

- **`UserBranchAccess`** — vínculo usuário ↔ filial  
  Campos: `userId`, `branchId`, `scope` (`MEMBER` | `MANAGER` | `ADMIN`).

**Regras de integridade:**

- `code` único por tenant
- `documentNumber` único por tenant (quando informado)
- Apenas **uma** filial com `isHeadquarters = true` por tenant

**Migration:** `packages/database/prisma/migrations/20260705100000_add_branches/`

---

### 2. Backend (NestJS)

Módulo em `apps/api/src/modules/branches/`:

| Componente | Função |
|------------|--------|
| `branches.controller.ts` | Endpoints REST + `@RequirePermissions` |
| `branches.service.ts` | Regras de negócio, paginação, ABAC, audit |
| `dto/branch.dto.ts` | Validação de entrada (sem `tenantId` no body) |

**Endpoints:**

```txt
GET    /branches
GET    /branches/:id
POST   /branches
PATCH  /branches/:id
PATCH  /branches/:id/disable
PATCH  /branches/:id/enable
DELETE /branches/:id
GET    /branches/:id/users
POST   /branches/:id/users
DELETE /branches/:id/users/:userId
```

**Listagem** suporta: busca, filtro por status, filtro matriz, paginação (`page`, `perPage`), ordenação com **whitelist** de campos.

**Segurança:**

- `tenantId` sempre do JWT (`currentUser.tenantId`)
- Busca por ID usa `id + tenantId`
- Usuário **sem** escopo global só vê/acessa filiais em `UserBranchAccess`
- Admin master (owner / `branches.manage` / `organization.manage` / `*`) vê **todas** as filiais do tenant

**Auditoria** — eventos registrados:

`BRANCH_CREATED`, `BRANCH_UPDATED`, `BRANCH_DISABLED`, `BRANCH_ENABLED`, `BRANCH_DELETED`, `BRANCH_USER_ASSIGNED`, `BRANCH_USER_REMOVED`

---

### 3. Permissões e roles (seed)

**Novas permissões:**

```txt
branches.read
branches.create
branches.update
branches.disable
branches.delete
branches.manage
branches.assign_users
organization.read
organization.manage
```

**Roles atualizadas (sem criar role nova):**

| Role | Branches |
|------|----------|
| `owner` | `*` (tudo) |
| `tenant-admin` | `branches.*`, `organization.*` |
| `operations-manager` | `branches.read`, `organization.read` |

Arquivo: `packages/database/prisma/seed-data/permissions.ts`

---

### 4. ABAC (object-level)

Extensão em `AuthorizationService`:

- `hasGlobalBranchScope(permissions)` — identifica admin master da organização
- Listagem e acesso a filial individual respeitam `UserBranchAccess` quando não há escopo global

---

### 5. RLS (preparada)

Policies de isolamento por tenant em:

- `Branch`
- `UserBranchAccess`

Scripts atualizados:

- `packages/database/sql/security/03-enable-rls-core.sql`
- `packages/database/sql/security/04-force-rls-core.sql`
- Migration SQL inclui policies

**Importante:** em dev local ainda se usa `postgres` owner — **FORCE RLS não está ativo** em runtime dev (conforme decisão canônica do projeto). Scripts ficam prontos para staging/prod com `nexum_app`.

---

### 6. Frontend (Admin UI)

**Rota:** `/app/admin/branches`  
**Componente:** `apps/web/components/app/branches-admin-page.tsx`

A tela inclui:

- Listagem paginada (server-side)
- Busca e filtros (status, matriz)
- Modal criar/editar filial
- Ações: desativar, reativar, excluir (soft delete)
- Drawer **Usuários da filial** (vincular/remover)
- `PermissionGate`, loading, empty state, error state, toasts
- Item **Filiais** no sidebar (i18n pt/en/es)

API client: funções em `apps/web/lib/admin-api.ts`

---

### 7. Dados demo (seed)

Tenant **`nexum-demo`** recebe 5 filiais:

| Código | Nome |
|--------|------|
| MATRIZ | Matriz |
| SANTOS | Santos |
| BOTUCATU | Botucatu |
| PARANAGUA | Paranaguá |
| RONDONOPOLIS | Rondonópolis |

**Vínculos demo de usuários:**

| Usuário | Filiais | Escopo |
|---------|---------|--------|
| `operacao@nexumtower.local` | Santos, Paranaguá | MANAGER |
| `operador@nexumtower.local` | Botucatu | MEMBER |

Owner/admin **não precisa** de vínculo explícito — têm escopo global via `*`.

Arquivo: `packages/database/prisma/seed-data/branches.ts`

---

### 8. Testes

| Tipo | Arquivo | Cobertura |
|------|---------|-----------|
| Unitário API | `branches.service.spec.ts` | tenant, escopo, audit, conflitos, ABAC |
| E2E (spec) | `tests/e2e/core-platform.spec.ts` | menu Filiais, rota admin |

**Resultado na validação:**

```txt
pnpm typecheck  → OK
pnpm test:api   → 71/71 OK
pnpm build      → OK
```

---

## Como usar

### 1. Aplicar seed (se ainda não rodou)

```bash
pnpm db:seed
```

### 2. Login admin

- URL: `http://localhost:3000/pt/login`
- E-mail: `admin@nexumtower.local`
- Senha: `admin123`

### 3. Acessar Filiais

Menu **Administração → Filiais** ou direto: `/app/admin/branches`

### 4. Testar escopo por filial

Login como `operacao@nexumtower.local` / `test123` — deve ver apenas filiais vinculadas (Santos e Paranaguá).

---

## Impacto nos próximos módulos

Todos os cadastros logísticos futuros devem considerar:

```txt
tenantId  = isolamento SaaS (obrigatório)
branchId  = escopo operacional (quando aplicável)
```

Exemplos previstos na Fase 1.1+:

- `Customer.branchId`
- `Driver.branchId`
- `Vehicle.branchId`
- `Trip.branchId`
- etc.

---

## Pendências conhecidas

| Item | Situação |
|------|----------|
| E2E Playwright completo | Specs adicionados; execução manual pendente com stack dev |
| FORCE RLS + `nexum_app` | Scripts prontos; ativação em staging/prod |
| `prisma migrate dev` | Histórico de migration antiga alterada — schema aplicado via `db push` + SQL versionado |
| Permissões na sessão | Após seed, fazer **logout/login** para recarregar permissões no frontend |

---

## Próximo passo recomendado

**Fase 1.1 — Customers** com suporte a `branchId`, mantendo RBAC, ABAC, RLS, AuditLog e PermissionGate em todo fluxo.

---

## Documentação técnica relacionada

| Documento | Conteúdo |
|-----------|----------|
| [modules/organization/README.md](./modules/organization/README.md) | Índice do módulo |
| [modules/organization/BRANCHES.md](./modules/organization/BRANCHES.md) | API e modelo Branch |
| [modules/organization/USER-BRANCH-ACCESS.md](./modules/organization/USER-BRANCH-ACCESS.md) | Vínculo usuário-filial |
| [modules/organization/PERMISSIONS.md](./modules/organization/PERMISSIONS.md) | Permissões RBAC |
| [modules/organization/RLS.md](./modules/organization/RLS.md) | Policies PostgreSQL |
| [RBAC.md](./RBAC.md) | Papéis e permissões gerais |
| [SECURITY-GUARDRAILS.md](./SECURITY-GUARDRAILS.md) | Regras permanentes de segurança |
| [FASE-1.0.1-O-QUE-FOI-FEITO.md](./FASE-1.0.1-O-QUE-FOI-FEITO.md) | Hardening 1.0.1 — o que foi feito |
| [FASE-1.0.1-HARDENING.md](./FASE-1.0.1-HARDENING.md) | Hardening 1.0.1 — checklist técnico |
| [FASE-1.0.2-FECHAMENTO.md](./FASE-1.0.2-FECHAMENTO.md) | Fechamento 10/10 — checklist técnico |
| [FASE-1.0.2-O-QUE-FOI-FEITO.md](./FASE-1.0.2-O-QUE-FOI-FEITO.md) | Fechamento 10/10 — o que foi feito |

---

## Resumo em uma frase

Implementamos **filiais dentro do tenant** — com CRUD seguro, escopo por usuário, audit log, RLS preparada, tela admin premium e base pronta para que **todos os cadastros logísticos futuros usem `branchId`**.
