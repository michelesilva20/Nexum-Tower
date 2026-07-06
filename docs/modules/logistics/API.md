# API — Customers

Base: `/logistics/customers`

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/logistics/customers` | customers.read |
| GET | `/logistics/customers/:id` | customers.read |
| POST | `/logistics/customers` | customers.create |
| PATCH | `/logistics/customers/:id` | customers.update |
| PATCH | `/logistics/customers/:id/disable` | customers.disable |
| PATCH | `/logistics/customers/:id/enable` | customers.disable |
| DELETE | `/logistics/customers/:id` | customers.delete |
| GET | `/logistics/customers/:id/branches` | customers.read |
| POST | `/logistics/customers/:id/branches` | customers.assign_branches |
| PATCH | `/logistics/customers/:id/branches/:branchId/primary` | customers.assign_branches |
| DELETE | `/logistics/customers/:id/branches/:branchId` | customers.assign_branches |

## Query listagem

`search`, `status`, `customerType`, `documentType`, `branchId`, `city`, `state`, `page`, `perPage`, `sortBy`, `sortDirection`

`sortBy` whitelist no DTO e service.

## Segurança

- `tenantId` sempre de `currentUser.tenantId`
- **Leitura:** ABAC via `CustomerBranch` + `UserBranchAccess`; filiais filtradas no response para usuários limitados
- **Mutação global** (PATCH, disable, enable, DELETE, POST create): escopo global obrigatório
- **CustomerBranch** (assign, primary, remove): `customers.assign_branches` + escopo global
- AuditLog em todas mutações sensíveis
