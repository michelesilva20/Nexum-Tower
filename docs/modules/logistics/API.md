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

## Drivers

Base: `/logistics/drivers`

| Método | Rota | Permissão RBAC |
|--------|------|----------------|
| GET | `/logistics/drivers` | drivers.read **ou** logistics.read |
| GET | `/logistics/drivers/:id` | drivers.read **ou** logistics.read |
| POST | `/logistics/drivers` | drivers.create |
| PATCH | `/logistics/drivers/:id` | drivers.update |
| PATCH | `/logistics/drivers/:id/disable` | drivers.disable |
| PATCH | `/logistics/drivers/:id/enable` | drivers.disable |
| DELETE | `/logistics/drivers/:id` | drivers.delete |
| GET | `/logistics/drivers/:id/branches` | drivers.read **ou** logistics.read |
| POST | `/logistics/drivers/:id/branches` | drivers.assign_branches |
| PATCH | `/logistics/drivers/:id/branches/:branchId/primary` | drivers.assign_branches |
| DELETE | `/logistics/drivers/:id/branches/:branchId` | drivers.assign_branches |

### Query listagem Drivers

`search`, `status`, `availabilityStatus`, `driverType`, `employmentType`, `branchId`, `licenseCategory`, `licenseExpiringUntil`, `moppExpiringUntil`, `city`, `state`, `page`, `perPage`, `sortBy`, `sortDirection`

`sortBy` whitelist: `code`, `fullName`, `driverType`, `employmentType`, `status`, `availabilityStatus`, `licenseExpiresAt`, `moppExpiresAt`, `city`, `state`, `createdAt`, `updatedAt`

## Segurança (Drivers)

- Dados pessoais **não** entram em AuditLog.metadata
- Motorista ACTIVE exige CNH completa (número, categoria, vencimento)
- `moppExpiresAt` obrigatório se `moppCertified = true`

## Vehicles

Base: `/logistics/vehicles`

| Método | Rota | Permissão RBAC |
|--------|------|----------------|
| GET | `/logistics/vehicles` | vehicles.read **ou** logistics.read |
| GET | `/logistics/vehicles/:id` | vehicles.read **ou** logistics.read |
| POST | `/logistics/vehicles` | vehicles.create |
| PATCH | `/logistics/vehicles/:id` | vehicles.update |
| PATCH | `/logistics/vehicles/:id/disable` | vehicles.disable |
| PATCH | `/logistics/vehicles/:id/enable` | vehicles.disable |
| DELETE | `/logistics/vehicles/:id` | vehicles.delete |
| GET | `/logistics/vehicles/:id/branches` | vehicles.read **ou** logistics.read |
| POST | `/logistics/vehicles/:id/branches` | vehicles.assign_branches |
| PATCH | `/logistics/vehicles/:id/branches/:branchId/primary` | vehicles.assign_branches |
| DELETE | `/logistics/vehicles/:id/branches/:branchId` | vehicles.assign_branches |

### Query listagem Vehicles

`search`, `status`, `availabilityStatus`, `vehicleType`, `vehicleCategory`, `ownershipType`, `branchId`, `brand`, `model`, `plate`, `fleetNumber`, `licensingExpiringUntil`, `insuranceExpiringUntil`, `inspectionExpiringUntil`, `tachographExpiringUntil`, `anttExpiringUntil`, `page`, `perPage`, `sortBy`, `sortDirection`

### Placa

Normalização: uppercase, sem espaços/hífen (`ABC1D23`).

## Segurança (Vehicles)

- RENAVAM/chassi/rastreador **não** entram completos em AuditLog.metadata
