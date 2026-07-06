# Branches (Filiais)

> Fechamento 10/10: [FASE-1.0.2-FECHAMENTO.md](../../FASE-1.0.2-FECHAMENTO.md)

## Objetivo

Permitir múltiplas unidades operacionais por tenant, com controle de acesso por filial.

## Modelo Prisma

Tabela `Branch` — campos principais:

- `tenantId` (obrigatório)
- `code` (único **permanentemente** por tenant — inclui soft-deleted)
- `name`, `legalName`, endereço, contato
- `status`: `ACTIVE` | `INACTIVE` | `DISABLED`
- `isHeadquarters` (apenas uma matriz ativa por tenant — índice parcial no banco)
- `disabledAt`, `deletedAt` (soft delete)

### Integridade de banco

| Índice | Regra |
|--------|--------|
| `Branch_tenantId_code_key` | `tenantId + code` único **permanentemente** (Fase 1.0.2) |
| `Branch_one_headquarters_per_tenant_idx` | Uma matriz com `deletedAt IS NULL` por tenant |
| `Branch_tenantId_documentNumber_active_key` | Documento único entre **ativos** (quando informado) |

### Decisões oficiais

| Campo | Regra |
|-------|--------|
| **code** | Identidade operacional permanente — **não reutilizável** após soft delete |
| **documentNumber** | Opcional; múltiplos NULL; único entre filiais **ativas** quando informado |

Pré-check antes de migration de code: `pnpm db:check:branch-code-duplicates`

## API

Base: `/branches` (mesmo padrão de `/groups`, `/users`).

| Método | Rota | Permissão | ABAC |
|--------|------|-----------|------|
| GET | `/branches` | `branches.read` | Global ou UserBranchAccess |
| GET | `/branches/:id` | `branches.read` | Global ou UserBranchAccess |
| POST | `/branches` | `branches.create` | **Escopo global** |
| PATCH | `/branches/:id` | `branches.update` | **Escopo global** |
| PATCH | `/branches/:id/disable` | `branches.disable` | **Escopo global** |
| PATCH | `/branches/:id/enable` | `branches.disable` | **Escopo global** |
| DELETE | `/branches/:id` | `branches.delete` | **Escopo global** |
| GET | `/branches/:id/users` | `branches.read` | Global ou UserBranchAccess |
| POST | `/branches/:id/users` | `branches.assign_users` | Global ou acesso à filial |
| DELETE | `/branches/:id/users/:userId` | `branches.assign_users` | Global ou acesso à filial |

Listagem suporta: `search`, `status`, `isHeadquarters`, `page`, `perPage`, `sortBy`, `sortDirection`.

### Erros de unicidade

- Code duplicado (inclui soft-deleted): *"Não é possível reutilizar este código de filial. Ele já foi usado neste tenant."*
- Documento duplicado entre ativos: *"Já existe uma filial ativa com este documento neste tenant."*

## ABAC

- `tenantId` sempre do JWT (`currentUser.tenantId`)
- **Escopo global:** `branches.manage`, `organization.manage` ou `*`
- **Escopo limitado:** apenas filiais em `UserBranchAccess`
- Mutações da **entidade filial** exigem escopo global (admin master)

## AuditLog

Eventos: `BRANCH_CREATED`, `BRANCH_UPDATED`, `BRANCH_DISABLED`, `BRANCH_ENABLED`, `BRANCH_DELETED`, `BRANCH_USER_ASSIGNED`, `BRANCH_USER_REMOVED`

## Frontend

Rota: `/app/admin/branches` — PermissionGate por ação. Erro de code duplicado exibido via toast; modal permanece aberto.

## Seed demo

Tenant `nexum-demo`: Matriz, Santos, Botucatu, Paranaguá, Rondonópolis.

## Próximo módulo

Recomendação Fase 1.1: `Customer` + `CustomerBranch` (não `Customer.branchId` simples).
