# Fase 1.1 — O que foi feito (Customers + CustomerBranch)

> **Documento explicativo** · julho/2026  
> **Escopo:** primeiro cadastro mestre logístico do Nexum Tower  
> **Status:** concluído para desenvolvimento — **GO Locations (dev)** · **NO-GO produção** (RLS runtime)

Este documento explica **em linguagem clara** o trabalho da **Fase 1.1**. Para detalhes técnicos por área, consulte [docs/modules/logistics/](./modules/logistics/README.md). Para as fases anteriores de filiais, consulte [FASE-1.0-FILIAIS.md](./FASE-1.0-FILIAIS.md), [FASE-1.0.2-O-QUE-FOI-FEITO.md](./FASE-1.0.2-O-QUE-FOI-FEITO.md) e [FASE-1.0.2-FECHAMENTO.md](./FASE-1.0.2-FECHAMENTO.md).

---

## Contexto

Com a camada **Organizational Branches** fechada em 10/10 para desenvolvimento (Fases 1.0 → 1.0.2), o Nexum Tower precisava do **primeiro cadastro logístico real**: **Clientes**.

Empresas de transporte atendem múltiplos clientes (Vale, Suzano, BRF etc.) e, frequentemente, **o mesmo cliente opera com várias filiais da transportadora** — Matriz, Santos, Paranaguá, por exemplo.

A **Fase 1.1** implementa exatamente isso, sem atalhos arquiteturais.

---

## Decisão arquitetural principal

```txt
Customer        = entidade global do tenant
CustomerBranch  = vínculo operacional entre cliente e filial
```

### O que NÃO foi feito (de propósito)

- **Não** usamos `Customer.branchId` obrigatório simples (evita duplicar CNPJ, histórico e cadastro).
- **Não** confundimos endereço fiscal do Customer com locais operacionais (coleta/entrega → módulo **Locations**, fase futura).
- **Não** implementamos viagens, cargas, motoristas, frota ou outros módulos logísticos.

### Por que CustomerBranch?

| Benefício | Explicação |
|-----------|------------|
| Um CNPJ, um cadastro | Cliente global no tenant |
| Multi-filial | Vale atendida por Matriz + Santos + Paranaguá |
| Escopo operacional | Usuário de Botucatu só vê clientes vinculados a Botucatu |
| Relatórios consolidados | Mesmo cliente, visão tenant-wide para quem tem escopo global |
| Evolução futura | Prepara viagens, cargas, custos e documentos por filial |

### Exemplo conceitual

```txt
Tenant: Transmaion Transportes

Customer: Vale S.A.
CustomerBranches:
  - Matriz      (principal)
  - Santos
  - Paranaguá
```

---

## Regras de negócio implementadas

### Customer

| Regra | Implementação |
|-------|---------------|
| `code` único permanentemente | Índice `Customer_tenantId_code_key` — não reutilizável após soft delete (igual Branches) |
| `documentNumber` único entre ativos | Índice parcial quando `deletedAt IS NULL` |
| `code` imutável | Não exposto no `UpdateCustomerDto` |
| Endereço | Fiscal/cobrança apenas — não é local operacional |
| Cliente órfão proibido | Create exige `branchIds` (≥1); remove branch bloqueia se for a última ativa |

### CustomerBranch

| Regra | Implementação |
|-------|---------------|
| Um cliente, várias filiais | Relação N:N via `CustomerBranch` |
| Uma filial principal | `isPrimary = true` — índice parcial único por customer |
| Vínculo único | `tenantId + customerId + branchId` |
| Remoção segura | Service valida contagem de filiais ativas antes de remover |

### ABAC (escopo por filial)

**Usuário com escopo global** (`*`, `customers.manage`, `logistics.manage`, `organization.manage`):

- Vê e opera todos os clientes do tenant.

**Usuário sem escopo global:**

- Só vê clientes com `CustomerBranch` em filial que ele acessa via `UserBranchAccess`.
- Pode editar/desativar/excluir se tiver acesso a **pelo menos uma** filial vinculada ao cliente.
- Na criação, só pode vincular filiais que ele acessa.

---

## O que foi feito

### 1. Banco de dados (Prisma + PostgreSQL)

**Novos enums:**

- `CustomerStatus` — ACTIVE, INACTIVE, DISABLED
- `CustomerType` — CONTRACTING_CUSTOMER, SHIPPER, CONSIGNEE, etc.
- `CustomerDocumentType` — CNPJ, CPF, NIF, EIN, VAT, OTHER
- `CustomerBranchStatus` — ACTIVE, INACTIVE, DISABLED

**Novos models:**

- **`Customer`** — cadastro global: identificação, documentos fiscais, contato, endereço de cobrança, status, notes, soft delete.
- **`CustomerBranch`** — vínculo `customerId` + `branchId`, `isPrimary`, status, soft delete.

**Migration:** `20260706140000_add_customers`

**Índices principais:**

| Índice | Proteção |
|--------|----------|
| `Customer_tenantId_code_key` | Code único permanentemente por tenant |
| `Customer_tenantId_documentNumber_active_key` | Documento único entre ativos |
| `CustomerBranch_tenantId_customerId_branchId_key` | Vínculo único |
| `CustomerBranch_one_primary_per_customer_idx` | Uma principal ativa por customer |

**RLS:** policies `Customer_tenant_isolation` e `CustomerBranch_tenant_isolation` na migration + script `07-customers-hardening.sql`.

---

### 2. Backend (API NestJS)

**Módulo:** `apps/api/src/modules/customers/`

| Arquivo | Função |
|---------|--------|
| `customers.controller.ts` | REST em `/logistics/customers` |
| `customers.service.ts` | CRUD, ABAC, audit, regras de filial |
| `customers.module.ts` | Registro no `AppModule` |
| `dto/customer.dto.ts` | Create, Update, List, Assign, SetPrimary |
| `customers.service.spec.ts` | 15 testes unitários |

**Endpoints:**

```txt
GET    /logistics/customers
GET    /logistics/customers/:id
POST   /logistics/customers
PATCH  /logistics/customers/:id
PATCH  /logistics/customers/:id/disable
PATCH  /logistics/customers/:id/enable
DELETE /logistics/customers/:id
GET    /logistics/customers/:id/branches
POST   /logistics/customers/:id/branches
PATCH  /logistics/customers/:id/branches/:branchId/primary
DELETE /logistics/customers/:id/branches/:branchId
```

**Segurança em todos os endpoints:**

- Autenticação + tenant via `currentUser.tenantId`
- RBAC com `@RequirePermissions`
- ABAC via `AuthorizationService.hasGlobalCustomerScope` + `UserBranchAccess`
- AuditLog em mutações sensíveis
- `sortBy` com whitelist (DTO + service)

**Eventos de auditoria:**

```txt
CUSTOMER_CREATED / UPDATED / DISABLED / ENABLED / DELETED
CUSTOMER_BRANCH_ASSIGNED / REMOVED
CUSTOMER_PRIMARY_BRANCH_CHANGED
```

**Total na API:** **97/97** testes passando (antes: 82).

---

### 3. Permissões e roles (seed)

**Novas permissões:**

```txt
customers.delete
customers.manage
customers.assign_branches
logistics.read
logistics.manage
```

**Roles atualizadas:**

| Role | Permissões de clientes |
|------|------------------------|
| owner | `*` |
| tenant-admin | `customers.*`, `logistics.*` |
| operations-manager | read, create, update, disable, assign_branches, logistics.read |
| logistics-operator | customers.read, logistics.read |
| viewer / finance-analyst | customers.read (já existia) |

---

### 4. Seed demo

**Arquivo:** `packages/database/prisma/seed-data/customers.ts`

**5 clientes fictícios** no tenant `nexum-demo`:

| Código | Cliente | Filiais vinculadas | Principal |
|--------|---------|-------------------|-----------|
| VALE | Vale S.A. Demo | MATRIZ, SANTOS, PARANAGUA | MATRIZ |
| CITROSUCO | Citrosuco Demo | BOTUCATU, SANTOS | BOTUCATU |
| SUZANO | Suzano Demo | MATRIZ, PARANAGUA | MATRIZ |
| AMBEV | Ambev Demo | MATRIZ, RONDONOPOLIS | MATRIZ |
| BRF | BRF Demo | SANTOS, PARANAGUA | SANTOS |

Dados são fictícios — sem informações sensíveis reais.

**Cenário ABAC para testes:**

- `operacao@nexumtower.local` (Santos + Paranaguá) → vê VALE, BRF, SUZANO (parcial)
- `operador@nexumtower.local` (Botucatu) → vê apenas CITROSUCO

---

### 5. Frontend

**Rota:** `/app/logistics/customers`  
**Sidebar:** grupo **Logística** → **Clientes**  
**Permissão de menu:** `customers.read` ou `logistics.read`

**Arquivos:**

- `apps/web/lib/logistics-api.ts` — client HTTP
- `apps/web/components/app/customers-logistics-page.tsx` — tela completa

**Funcionalidades da tela:**

| Área | Conteúdo |
|------|----------|
| Header | Título, subtítulo, botão Novo cliente (`customers.create`) |
| Filtros | search, status, tipo, filial, cidade, UF, limpar filtros |
| Tabela | Código, cliente, documento, tipo, filiais, principal, contato, cidade/UF, status, ações |
| Drawer formulário | Seções: identificação, fiscal, contato, endereço, filiais (create), notes |
| Drawer detalhes | Resumo, filiais, metadados |
| Drawer filiais | Vincular, remover, definir principal (`customers.assign_branches`) |
| Estados | loading (skeleton), empty, error, submitting, toasts |
| PermissionGate | Ações protegidas por permissão |

**Design:** Nexum Design System (PageHeader, NexumCard, NexumDataTable, NexumDrawer, NexumBadge, etc.) — dark premium, glassmorphism controlado.

**i18n:** chaves `logistics` e `customers` em pt/en/es.

---

### 6. RLS

Scripts preparados (não ativa FORCE RLS em dev):

| Script | Conteúdo |
|--------|----------|
| Migration `20260706140000` | Policies iniciais |
| `07-customers-hardening.sql` | Hardening idempotente |
| `03-enable-rls-core.sql` | Customer + CustomerBranch incluídos |
| `05-test-rls-isolation.sql` | Cenários 9–11 (Customer, CustomerBranch) |

**Status local (Windows):** `pnpm security:rls:test` falha — `psql` ausente (mesmo cenário das Fases 1.0.x).

---

### 7. E2E Playwright

**Arquivo criado:** `tests/e2e/customers.spec.ts`

**Cenários planejados:**

- Admin vê menu Clientes e listagem (VALE, CITROSUCO)
- Admin vê botão Novo cliente
- Viewer com `customers.read` acessa listagem
- `operacao@` vê VALE/BRF, não vê CITROSUCO
- `operador@` vê apenas CITROSUCO

**Status:** spec criado; execução requer `pnpm dev:e2e` + stack ativa (não rodado nesta sessão de documentação).

---

### 8. Documentação técnica

Pasta `docs/modules/logistics/`:

| Documento | Conteúdo |
|-----------|----------|
| [README.md](./modules/logistics/README.md) | Visão geral do módulo |
| [CUSTOMERS.md](./modules/logistics/CUSTOMERS.md) | Model Customer, regras |
| [CUSTOMER-BRANCH.md](./modules/logistics/CUSTOMER-BRANCH.md) | Vínculo operacional |
| [PERMISSIONS.md](./modules/logistics/PERMISSIONS.md) | RBAC |
| [RLS.md](./modules/logistics/RLS.md) | Policies e runtime |
| [API.md](./modules/logistics/API.md) | Endpoints REST |

---

## Arquivos de código

### Criados

```
packages/database/prisma/migrations/20260706140000_add_customers/
packages/database/prisma/seed-data/customers.ts
packages/database/sql/security/07-customers-hardening.sql
apps/api/src/modules/customers/customers.controller.ts
apps/api/src/modules/customers/customers.module.ts
apps/api/src/modules/customers/customers.service.ts
apps/api/src/modules/customers/customers.service.spec.ts
apps/api/src/modules/customers/dto/customer.dto.ts
apps/web/lib/logistics-api.ts
apps/web/components/app/customers-logistics-page.tsx
tests/e2e/customers.spec.ts
docs/FASE-1.1-O-QUE-FOI-FEITO.md
docs/modules/logistics/*.md
```

### Alterados

```
packages/database/prisma/schema.prisma
packages/database/prisma/seed.ts
packages/database/prisma/seed-data/permissions.ts
packages/database/sql/security/03-enable-rls-core.sql
packages/database/sql/security/05-test-rls-isolation.sql
apps/api/src/app.module.ts
apps/api/src/common/audit-actions.ts
apps/api/src/modules/authorization/authorization.service.ts
apps/web/lib/navigation.ts
apps/web/components/app/admin-section-router.tsx
apps/web/messages/pt.json
apps/web/messages/en.json
apps/web/messages/es.json
```

---

## Validação executada

| Comando | Resultado |
|---------|-----------|
| `pnpm db:generate` | ✅ OK |
| `pnpm db:migrate:deploy` | ✅ OK (migration `20260706140000` aplicada) |
| `pnpm db:seed` | ✅ OK (5 clientes + permissões) |
| `pnpm typecheck` | ✅ OK |
| `pnpm lint` | ✅ OK |
| `pnpm test:api` | ✅ **97/97** |
| `pnpm build` | ✅ OK |
| `pnpm test:e2e` (customers) | ⏸ não executado (requer stack dev) |
| `pnpm security:rls:test` | ❌ psql ausente no Windows |

---

## Como rodar localmente

```bash
# Banco
pnpm db:migrate:deploy
pnpm db:seed

# API + testes
pnpm test:api

# Frontend (manual)
pnpm dev
# Acesse: /app/logistics/customers
# Login: admin@nexumtower.local / admin123

# E2E (opcional)
pnpm dev:e2e
pnpm test:e2e -- tests/e2e/customers.spec.ts
```

**Usuários úteis para testar ABAC:**

| E-mail | Senha | Escopo |
|--------|-------|--------|
| admin@nexumtower.local | admin123 | Global |
| operacao@nexumtower.local | test123 | Santos + Paranaguá |
| operador@nexumtower.local | test123 | Botucatu |
| visualizador@nexumtower.local | test123 | Read-only |

---

## Pendências conhecidas

1. **RLS runtime** — FORCE RLS + role `nexum_app` em staging/prod
2. **`pnpm security:rls:test`** — executar em Linux/CI ou com Docker + psql
3. **E2E customers** — rodar e validar spec criado
4. **Cards de resumo** na listagem (total/ativos/desativados) — opcional, não implementado para evitar dashboard fake
5. **Atualização** de `GO-NO-GO-LOGISTICS-CORE.md` e `PANORAMA-ATUAL.md` — recomendado na próxima revisão de docs

Nenhuma pendência bloqueia o início de **Locations** em desenvolvimento.

---

## GO / NO-GO

| Contexto | Decisão |
|----------|---------|
| **Iniciar Fase 1.2 — Locations** | ✅ **GO (dev)** |
| **Deploy em produção** | ⚠️ **NO-GO** até RLS runtime validado com `nexum_app` + FORCE RLS |

---

## Conclusão

A **Fase 1.1** entregou o **primeiro cadastro mestre logístico** do Nexum Tower:

```txt
Customers + CustomerBranch
CRUD completo · tenant isolation · branch isolation · RBAC · ABAC · RLS preparada · AuditLog · UI premium · testes · documentação
```

Esta implementação é o **padrão de referência** para os próximos cadastros:

```txt
Locations → Drivers → Vehicles → Routes → RoutePoints
```

Próximo passo recomendado:

```txt
Nexum Logistics Core — Fase 1.2
Locations (locais operacionais de coleta, entrega, pátios, bases)
```

---

## Documentação relacionada

- [FASE-1.0.2-O-QUE-FOI-FEITO.md](./FASE-1.0.2-O-QUE-FOI-FEITO.md) — fechamento de Filiais
- [modules/logistics/README.md](./modules/logistics/README.md) — módulo logístico
- [modules/organization/BRANCHES.md](./modules/organization/BRANCHES.md) — filiais (base do ABAC)
- [GO-NO-GO-LOGISTICS-CORE.md](./GO-NO-GO-LOGISTICS-CORE.md) — critérios de avanço
