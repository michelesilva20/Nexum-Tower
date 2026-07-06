# Permissões — Logistics

## Customers

| Key | Uso |
|-----|-----|
| `customers.read` | Listar/visualizar |
| `customers.create` | Criar |
| `customers.update` | Editar dados |
| `customers.disable` | Desativar/reativar |
| `customers.delete` | Soft delete |
| `customers.manage` | Escopo global ABAC |
| `customers.assign_branches` | Vínculos CustomerBranch |

## Locations (Fase 1.2)

| Key | Uso |
|-----|-----|
| `locations.read` | Listar/visualizar |
| `locations.create` | Criar |
| `locations.update` | Editar dados |
| `locations.disable` | Desativar/reativar |
| `locations.delete` | Soft delete |
| `locations.manage` | Escopo global ABAC |
| `locations.assign_branches` | Vínculos LocationBranch |

## Compartilhadas

| Key | Uso |
|-----|-----|
| `logistics.read` | Menu logística (alternativa a *.read) |
| `logistics.manage` | Escopo global ABAC |

## Semântica ABAC (Customers + Locations)

| Permissão | RBAC | ABAC adicional |
|-----------|------|----------------|
| `*.read` | Ver listagem/detalhe | Escopo por *Branch |
| `*.create` / `*.update` / disable / delete | Mutação | **Escopo global obrigatório** |
| `*.manage` | Admin ampla | Concede escopo global |
| `*.assign_branches` | Vínculos | **Escopo global obrigatório** |

Escopo global = `*.manage` | `logistics.manage` | `organization.manage` | `*`

## Roles (resumo)

| Role | Customers | Locations |
|------|-----------|-----------|
| owner | `*` | `*` |
| tenant-admin | `customers.*`, `logistics.*` | `locations.*`, `logistics.*` |
| operations-manager | read + create/update… | `locations.read` |
| logistics-operator | read | read |
| viewer | read | read |
