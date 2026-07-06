# VehicleBranch

Vínculo operacional entre veículo (`Vehicle`) e filial (`Branch`).

## Modelo

| Campo | Descrição |
|-------|-----------|
| `tenantId` | Isolamento SaaS |
| `vehicleId` | Veículo |
| `branchId` | Filial |
| `isPrimary` | Filial principal/responsável |
| `status` | ACTIVE, INACTIVE, DISABLED |

## Endpoints

```txt
GET    /logistics/vehicles/:id/branches
POST   /logistics/vehicles/:id/branches
PATCH  /logistics/vehicles/:id/branches/:branchId/primary
DELETE /logistics/vehicles/:id/branches/:branchId
```

## AuditLog

- `VEHICLE_BRANCH_ASSIGNED`
- `VEHICLE_BRANCH_REMOVED`
- `VEHICLE_PRIMARY_BRANCH_CHANGED`

Metadados seguros: `vehicleId`, `vehicleCode`, `vehiclePlate`, `branchId` — sem RENAVAM/chassi/rastreador completos.
