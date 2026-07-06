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

## Drivers (Fase 1.3)

| Key | Uso |
|-----|-----|
| `drivers.read` | Listar/visualizar |
| `drivers.create` | Criar |
| `drivers.update` | Editar dados |
| `drivers.disable` | Desativar/reativar |
| `drivers.delete` | Soft delete |
| `drivers.manage` | Escopo global ABAC |
| `drivers.assign_branches` | Vínculos DriverBranch |

## Vehicles (Fase 1.4)

| Key | Uso |
|-----|-----|
| `vehicles.read` | Listar/visualizar |
| `vehicles.create` | Criar |
| `vehicles.update` | Editar dados |
| `vehicles.disable` | Desativar/reativar |
| `vehicles.delete` | Soft delete |
| `vehicles.manage` | Escopo global ABAC |
| `vehicles.assign_branches` | Vínculos VehicleBranch |

## Compartilhadas

| Key | Uso |
|-----|-----|
| `logistics.read` | Menu logística (alternativa a *.read) |
| `logistics.manage` | Escopo global ABAC |

## Semântica ABAC (todos os cadastros *Branch)

| Permissão | RBAC | ABAC adicional |
|-----------|------|----------------|
| `*.read` | Ver listagem/detalhe | Escopo por *Branch |
| `*.create` / `*.update` / disable / delete | Mutação | **Escopo global obrigatório** |
| `*.manage` | Admin ampla | Concede escopo global |
| `*.assign_branches` | Vínculos | **Escopo global obrigatório** |

Escopo global = `*.manage` | `logistics.manage` | `organization.manage` | `*`

## Roles (resumo)

| Role | Customers | Locations | Drivers | Vehicles |
|------|-----------|-----------|---------|----------|
| owner | `*` | `*` | `*` | `*` |
| tenant-admin | `customers.*`, `logistics.*` | `locations.*`, `logistics.*` | `drivers.*`, `logistics.*` | `vehicles.*`, `logistics.*` |
| operations-manager | read + create/update… | `locations.read` | `drivers.read` | `vehicles.read` |
| logistics-operator | read | read | read | read |
| viewer | read | read | read | read |
