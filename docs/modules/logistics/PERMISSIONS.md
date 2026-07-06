# Permissões — Logistics / Customers

## Permissões

| Key | Uso |
|-----|-----|
| `customers.read` | Listar/visualizar |
| `customers.create` | Criar |
| `customers.update` | Editar dados |
| `customers.disable` | Desativar/reativar |
| `customers.delete` | Soft delete |
| `customers.manage` | Escopo global ABAC |
| `customers.assign_branches` | Vínculos CustomerBranch |
| `logistics.read` | Menu logística (alternativa) |
| `logistics.manage` | Escopo global ABAC |

## Semântica (Fase 1.1.1)

| Permissão | RBAC | ABAC adicional |
|-----------|------|----------------|
| `customers.read` | Ver listagem/detalhe | Escopo por CustomerBranch |
| `customers.create` | Criar | **Escopo global obrigatório** |
| `customers.update` | Atualizar | **Escopo global obrigatório** |
| `customers.disable` | Desativar/reativar | **Escopo global obrigatório** |
| `customers.delete` | Soft delete | **Escopo global obrigatório** |
| `customers.manage` | Admin ampla | Concede escopo global ABAC |
| `customers.assign_branches` | Vínculos | **Escopo global obrigatório** |
| `logistics.manage` | Módulo logística | Concede escopo global ABAC |

`customers.update` sozinho **não** autoriza mutação global — exige também escopo global via `customers.manage`, `logistics.manage`, `organization.manage` ou `*`.

| Role | Customers |
|------|-----------|
| owner | `*` |
| tenant-admin | `customers.*`, `logistics.*` |
| operations-manager | read/create/update/disable/assign + logistics.read |
| logistics-operator | read + logistics.read |
| viewer / finance-analyst | read |
