# API — Logistics

## Customers

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

## Locations

Base: `/logistics/locations`

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/logistics/locations` | locations.read **ou** logistics.read |
| GET | `/logistics/locations/:id` | locations.read **ou** logistics.read |
| POST | `/logistics/locations` | locations.create |
| PATCH | `/logistics/locations/:id` | locations.update |
| PATCH | `/logistics/locations/:id/disable` | locations.disable |
| PATCH | `/logistics/locations/:id/enable` | locations.disable |
| DELETE | `/logistics/locations/:id` | locations.delete |
| GET | `/logistics/locations/:id/branches` | locations.read **ou** logistics.read |
| POST | `/logistics/locations/:id/branches` | locations.assign_branches |
| PATCH | `/logistics/locations/:id/branches/:branchId/primary` | locations.assign_branches |
| DELETE | `/logistics/locations/:id/branches/:branchId` | locations.assign_branches |

### Query listagem Locations

`search`, `status`, `locationType`, `branchId`, `customerId`, `city`, `state`, `country`, `hasCoordinates`, `page`, `perPage`, `sortBy`, `sortDirection`

`sortBy` whitelist: `code`, `name`, `locationType`, `status`, `city`, `state`, `country`, `createdAt`, `updatedAt`

## Segurança (Customers + Locations)

- `tenantId` sempre de `currentUser.tenantId`
- **Leitura:** ABAC via `*Branch` + `UserBranchAccess`; filiais filtradas no response
- **Mutação global:** escopo global obrigatório (`*.manage`, `logistics.manage`, `organization.manage`, `*`)
- **Vínculos filiais:** `*.assign_branches` + escopo global
- **Locations + Customer:** se `customerId`, `branchIds` devem ser compatíveis com `CustomerBranch`
- AuditLog em mutações sensíveis
