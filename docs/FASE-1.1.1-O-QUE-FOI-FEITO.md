# Fase 1.1.1 — O que foi feito (Hardening Customers + CustomerBranch)

> **Documento explicativo** · julho/2026  
> **Escopo:** elevar Customers para **10/10 dev** — separação ABAC global vs filial  
> **Status:** ✅ concluído para desenvolvimento · E2E **7/7** · **GO Locations** · **NO-GO produção** (RLS runtime)

Este documento explica **em linguagem clara** o trabalho da **Fase 1.1.1**. Complementa [FASE-1.1-O-QUE-FOI-FEITO.md](./FASE-1.1-O-QUE-FOI-FEITO.md) (implementação original). Para detalhes técnicos por área, consulte [docs/modules/logistics/](./modules/logistics/README.md).

---

## Contexto

A **Fase 1.1** entregou o primeiro cadastro logístico real do Nexum Tower:

- Models `Customer` + `CustomerBranch`
- API REST completa em `/logistics/customers`
- Tela `/app/logistics/customers`
- Permissões RBAC, AuditLog, RLS preparada, seed demo, **97 testes API** passando

Porém, antes de usar Customers como **molde** dos próximos cadastros (Locations, Drivers, Vehicles…), era necessário um **hardening de segurança ABAC**: a implementação inicial permitia que um usuário com acesso a **uma filial** alterasse dados **globais** de um cliente que também opera em outras filiais.

A **Fase 1.1.1** foi exatamente isso: auditoria + correções + testes + E2E + documentação — **sem implementar Locations** nem refatorar o Core Platform.

---

## Por que o hardening era necessário

### O problema em uma frase

`Customer` é **global do tenant**. Se João (escopo Santos) puder editar a razão social da Vale S.A., ele altera um cadastro que também afeta Matriz e Paranaguá.

### Exemplo concreto

```txt
Customer: Vale S.A.
CustomerBranches: Matriz · Santos · Paranaguá

Usuário operacao@ → acesso apenas a Santos + Paranaguá
```

**Regra da Fase 1.1 (incorreta para produção):**

> Se o usuário tem acesso a ≥1 filial vinculada → pode editar/desativar/excluir o Customer.

**Risco:** alteração de CNPJ, e-mail fiscal, status global ou exclusão afetando todas as filiais — sem autorização administrativa.

### O que já estava correto na 1.1

- Modelagem `Customer` + `CustomerBranch` (decisão arquitetural mantida)
- Isolamento por `tenantId` via JWT
- Leitura ABAC por `CustomerBranch` ∩ `UserBranchAccess`
- Constraints de banco (code único, documento único entre ativos, uma principal por customer)
- AuditLog nos eventos de mutação
- RLS scripts preparados
- DTOs sem `tenantId`/`code` no update

### O que estava frágil

| Lacuna | Risco |
|--------|-------|
| Mutação global liberada por acesso a 1 filial | Usuário operacional altera cadastro fiscal global |
| CustomerBranch sem regra restritiva documentada | Vínculos alterados por quem não deveria |
| Frontend espelhava regra permissiva da API | Botões visíveis além do que a API deveria permitir |
| E2E criado mas não executado | Regressões ABAC passariam despercebidas |
| GO-NO-GO / PANORAMA desatualizados | Decisão de avançar para Locations sem base clara |

---

## Decisão arquitetural (mantida)

```txt
Customer        = entidade global do tenant
CustomerBranch  = vínculo operacional cliente ↔ filial
```

**Não alteramos** para `Customer.branchId` obrigatório simples. A separação global vs operacional continua sendo feita via `CustomerBranch` + ABAC.

---

## Nova regra de autorização (Fase 1.1.1)

### Escopo global

Usuário tem escopo global quando possui **qualquer uma** das permissões:

```txt
customers.manage
logistics.manage
organization.manage
*
```

### Matriz de ações

| Tipo de ação | Quem pode | Endpoints / UI |
|--------------|-----------|----------------|
| **Leitura por filial** | `CustomerBranch` ∩ `UserBranchAccess` (ou escopo global) | `GET` list, `GET :id`, `GET :id/branches` — filiais filtradas no response |
| **Mutação global** | Escopo global **obrigatório** | `POST`, `PATCH`, disable, enable, `DELETE` |
| **CustomerBranch** | `customers.assign_branches` + escopo global | assign, set primary, remove |

### Decisão sobre CustomerBranch

Adotamos a regra **mais restritiva**:

> Apenas usuários com **escopo global** podem gerenciar vínculos CustomerBranch.

Motivo: alterar filiais de um cliente global é ação administrativa — equivalente a mudar onde o cliente opera no tenant inteiro.

### Semântica de permissões RBAC

| Permissão | Papel |
|-----------|-------|
| `customers.read` | Ver clientes dentro do escopo ABAC |
| `customers.create` | Permissão RBAC — mas **create exige escopo global** na API |
| `customers.update` | Permissão RBAC — mas **update exige escopo global** na API |
| `customers.disable` / `customers.delete` | Idem — RBAC + escopo global |
| `customers.manage` | Administrativa ampla + **concede escopo global** |
| `customers.assign_branches` | Vínculos — RBAC + escopo global |

**Importante:** `operations-manager` pode ter `customers.update`, mas **sem** `customers.manage`/`logistics.manage` e sem escopo global → **não altera dados globais** (comportamento intencional).

### Regra mantida: última filial ativa

A API continua bloqueando remoção da **última** `CustomerBranch` ativa — cliente não pode ficar órfão.

---

## O que mudou na prática (1.1 → 1.1.1)

| Aspecto | Fase 1.1 | Fase 1.1.1 |
|---------|----------|------------|
| Update Customer | Escopo filial bastava | Escopo global obrigatório |
| Disable / Enable / Delete | Escopo filial bastava | Escopo global obrigatório |
| Create Customer | Escopo filial nas branchIds | Escopo global obrigatório |
| CustomerBranch (assign/primary/remove) | ABAC por filial | Escopo global obrigatório |
| Response `branches` | Todas as filiais do customer | Filtradas para usuário limitado |
| Botões Editar/Desativar/Filiais | Só RBAC | RBAC **+** escopo global |
| E2E Customers | Spec criado, não rodado | **7/7** executado |
| Testes API | 97 | **98** |

---

## O que foi feito

### 1. Backend — AuthorizationService

**Arquivo:** `apps/api/src/modules/authorization/authorization.service.ts`

Novos helpers centralizados (sem lógica paralela):

| Helper | Função |
|--------|--------|
| `hasGlobalCustomerScope(permissions)` | Detecta escopo administrativo/global |
| `assertCustomerGlobalMutationAllowed(permissions)` | Bloqueia mutação global sem escopo |
| `assertCustomerBranchMutationAllowed(permissions)` | Bloqueia vínculos sem escopo global |
| `canMutateCustomerGlobalData(permissions)` | Uso em guards/checks booleanos |
| `canManageCustomerBranches(permissions)` | Uso em guards/checks booleanos |

---

### 2. Backend — CustomersService

**Arquivo:** `apps/api/src/modules/customers/customers.service.ts`

**Mutações globais** passam por `assertCustomerGlobalMutationAllowed`:

- `create`
- `update`
- `disable`
- `enable`
- `remove` (soft delete)

**CustomerBranch** passa por `assertCustomerBranchMutationAllowed`:

- `assignBranches`
- `setPrimaryBranch`
- `removeBranch`

**Leitura:**

- `assertCustomerReadAccess` — valida visibilidade via escopo global ou interseção filial
- `applyBranchVisibilityToCustomer(s)` — remove filiais não acessíveis do JSON de resposta

**AuditLog** (validado, sem alteração de eventos):

```txt
CUSTOMER_CREATED · CUSTOMER_UPDATED · CUSTOMER_DISABLED · CUSTOMER_ENABLED · CUSTOMER_DELETED
CUSTOMER_BRANCH_ASSIGNED · CUSTOMER_BRANCH_REMOVED · CUSTOMER_PRIMARY_BRANCH_CHANGED
```

Metadata segura: `customerId`, `customerCode`, `branchId`, status anterior/novo — sem tokens nem payload completo.

---

### 3. Backend — Testes unitários

**Arquivo:** `apps/api/src/modules/customers/customers.service.spec.ts`

Cobertura ampliada para o hardening:

| Cenário | Validado |
|---------|----------|
| Admin global lista todos | ✅ |
| Usuário limitado — list/get filtrado | ✅ |
| Usuário limitado — getById bloqueado sem filial acessível | ✅ |
| Usuário limitado — update/disable/delete bloqueados | ✅ |
| Admin global — update/disable/delete permitidos | ✅ |
| CustomerBranch — exige escopo global | ✅ |
| Remove branch — última ativa bloqueada | ✅ |
| Audit em mutações autorizadas | ✅ |
| Visibilidade de filiais no response | ✅ |

**Total API após hardening:** **98/98** testes.

---

### 4. Frontend — PermissionGate alinhado à API

**Arquivo:** `apps/web/components/app/customers-logistics-page.tsx`

Constante de escopo global (espelha backend):

```typescript
const GLOBAL_CUSTOMER_SCOPE = [
  "customers.manage",
  "logistics.manage",
  "organization.manage",
  "*",
];
```

| Ação UI | Condição |
|---------|----------|
| Novo cliente | `customers.create` **+** escopo global |
| Editar | `customers.update` **+** escopo global |
| Desativar / Reativar / Excluir | permissão correspondente **+** escopo global |
| Filiais (drawer) | `customers.assign_branches` **+** escopo global |
| Listagem / detalhes | `customers.read` ou `logistics.read` (ABAC na API) |

Usuário `operacao@` vê clientes das suas filiais na tabela, mas **não** vê botões de mutação global.

---

### 5. E2E Playwright — executado e estabilizado

**Arquivo:** `tests/e2e/customers.spec.ts`

**Comando:** `pnpm exec playwright test tests/e2e/customers.spec.ts`  
**Resultado:** ✅ **7/7** (~1,1 min com `pnpm dev:e2e`)

| # | Cenário | Usuário | Resultado |
|---|---------|---------|-----------|
| 1 | Menu Clientes + listagem VALE/CITROSUCO | admin | ✅ |
| 2 | Botão Novo cliente visível | admin | ✅ |
| 3 | Code duplicado exibe toast de erro | admin | ✅ |
| 4 | Viewer acessa listagem, sem Novo cliente | viewer | ✅ |
| 5 | Vê VALE, BRF, CITROSUCO; AMBEV oculto | operacao@ | ✅ |
| 6 | Sem botões Editar/Desativar/Filiais | operacao@ | ✅ |
| 7 | Vê só CITROSUCO; VALE oculto | operador@ | ✅ |

**Correções aplicadas no E2E:**

1. **Code duplicado** — labels do `NexumFormField` não têm `htmlFor`; locators passaram a usar `getByRole("dialog")` + inputs + toast `"Não é possível reutilizar este código de cliente..."`.
2. **operacao@ + CITROSUCO** — seed vincula CITROSUCO a **BOTUCATU + SANTOS**; `operacao@` tem Santos → **deve ver** CITROSUCO. Cliente oculto correto: **AMBEV** (somente MATRIZ + RONDONOPOLIS).

**Cenário ABAC seed (referência):**

| Cliente | Filiais no seed |
|---------|-----------------|
| VALE | MATRIZ, SANTOS, PARANAGUA |
| CITROSUCO | BOTUCATU, SANTOS |
| SUZANO | MATRIZ, PARANAGUA |
| AMBEV | MATRIZ, RONDONOPOLIS |
| BRF | SANTOS, PARANAGUA |

| Usuário demo | Filiais acessíveis |
|--------------|-------------------|
| `operacao@nexumtower.local` | SANTOS, PARANAGUA |
| `operador@nexumtower.local` | BOTUCATU |

---

### 6. DTOs e validações (revisados, sem regressão)

| Regra | Status |
|-------|--------|
| `UpdateCustomerDto` não aceita `code` | ✅ |
| `tenantId` / timestamps / `disabledAt` / `deletedAt` não aceitos no body | ✅ |
| `branchIds` obrigatório na criação (≥1) | ✅ |
| `primaryBranchId` dentro de `branchIds` | ✅ |
| `sortBy` com whitelist | ✅ |
| `documentNumber` exige `documentType` quando informado | ✅ |

---

### 7. RLS

Scripts revisados — **sem migration nova**:

| Script | Conteúdo |
|--------|----------|
| Migration `20260706140000` | Policies iniciais Customer + CustomerBranch |
| `07-customers-hardening.sql` | Hardening idempotente |
| `05-test-rls-isolation.sql` | Cenários de isolamento |

**Status local (Windows):** `pnpm security:rls:test` ❌ — `psql` ausente.

```txt
RLS scripts preparados
RLS runtime NÃO validado localmente
NO-GO produção até nexum_app + FORCE RLS + security:rls:test
```

---

### 8. Documentação atualizada

**Módulo logístico:**

| Documento | Atualização |
|-----------|-------------|
| [CUSTOMERS.md](./modules/logistics/CUSTOMERS.md) | ABAC global vs leitura por filial |
| [CUSTOMER-BRANCH.md](./modules/logistics/CUSTOMER-BRANCH.md) | Regra restritiva de vínculos |
| [PERMISSIONS.md](./modules/logistics/PERMISSIONS.md) | Semântica `customers.update` vs escopo global |
| [API.md](./modules/logistics/API.md) | Matriz endpoint × escopo |
| [RLS.md](./modules/logistics/RLS.md) | Status runtime |
| [README.md](./modules/logistics/README.md) | Status 10/10 dev |

**Documentação central:**

| Documento | Atualização |
|-----------|-------------|
| [GO-NO-GO-LOGISTICS-CORE.md](./GO-NO-GO-LOGISTICS-CORE.md) | GO Locations · Customers 10/10 dev |
| [PANORAMA-ATUAL.md](./PANORAMA-ATUAL.md) | Camada Clientes · 98 testes API · E2E 7/7 |

---

## Arquivos alterados nesta fase

Esta fase **não criou migrations** — foco em segurança, testes e docs.

```
apps/api/src/modules/authorization/authorization.service.ts
apps/api/src/modules/customers/customers.service.ts
apps/api/src/modules/customers/customers.service.spec.ts
apps/web/components/app/customers-logistics-page.tsx
tests/e2e/customers.spec.ts
docs/modules/logistics/CUSTOMERS.md
docs/modules/logistics/CUSTOMER-BRANCH.md
docs/modules/logistics/PERMISSIONS.md
docs/modules/logistics/API.md
docs/modules/logistics/README.md
docs/modules/logistics/RLS.md
docs/GO-NO-GO-LOGISTICS-CORE.md
docs/PANORAMA-ATUAL.md
docs/FASE-1.1.1-O-QUE-FOI-FEITO.md   ← este documento
```

---

## Comandos executados

| Comando | Resultado |
|---------|-----------|
| `pnpm db:generate` | ✅ |
| `pnpm db:migrate:deploy` | ✅ |
| `pnpm db:seed` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm test:api` | ✅ **98/98** |
| `pnpm build` | ✅ |
| `pnpm test:e2e customers` | ✅ **7/7** |
| `pnpm security:rls:test` | ❌ `psql` ausente (Windows) |

---

## GO / NO-GO

| Contexto | Decisão |
|----------|---------|
| **Customers — desenvolvimento** | ✅ **10/10** |
| **Locations (Fase 1.2)** | ✅ **GO** |
| **Produção** | ⚠️ **NO-GO** até RLS runtime (`nexum_app`, FORCE RLS, `security:rls:test`) |

---

## Pendências e riscos

| Item | Status |
|------|--------|
| RLS runtime local | Pendente — instalar `psql` ou validar via Docker/CI |
| E2E admin gerencia filiais / remove última filial | Recomendado na Fase 1.2 (não bloqueante) |
| Dev usa role `postgres` | RLS não exercitada em runtime local — esperado |

---

## Próximo passo

**Nexum Logistics Core — Fase 1.2 — Locations**

Usar Customers como molde obrigatório:

```txt
Entidade global do tenant
Vínculo operacional por filial (quando aplicável)
ABAC: leitura por escopo · mutação global separada
PermissionGate alinhado à API
E2E executado (não só criado)
Documentação módulo + GO-NO-GO + PANORAMA
```

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [FASE-1.1-O-QUE-FOI-FEITO.md](./FASE-1.1-O-QUE-FOI-FEITO.md) | Implementação original Customers |
| [FASE-1.0.1-O-QUE-FOI-FEITO.md](./FASE-1.0.1-O-QUE-FOI-FEITO.md) | Hardening de Filiais (padrão seguido) |
| [GO-NO-GO-LOGISTICS-CORE.md](./GO-NO-GO-LOGISTICS-CORE.md) | Decisão oficial de avanço |
| [PANORAMA-ATUAL.md](./PANORAMA-ATUAL.md) | Estado geral do projeto |
