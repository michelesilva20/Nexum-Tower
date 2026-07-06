# DriverBranch

Vínculo operacional entre motorista (`Driver`) e filial (`Branch`).

## Modelo

| Campo | Descrição |
|-------|-----------|
| `tenantId` | Isolamento SaaS |
| `driverId` | Motorista |
| `branchId` | Filial |
| `isPrimary` | Filial principal/responsável |
| `status` | ACTIVE, INACTIVE, DISABLED |

## Unicidade

- `tenantId + driverId + branchId` — único
- Índice parcial: apenas uma filial `isPrimary = true` por motorista ativo

## Regras

- Motorista operacional deve ter ao menos uma filial ativa
- Usuário sem escopo global só vê motoristas com `DriverBranch` em filiais acessíveis
- Gerenciar vínculos exige escopo global + `drivers.assign_branches`

## Endpoints

```txt
GET    /logistics/drivers/:id/branches
POST   /logistics/drivers/:id/branches
PATCH  /logistics/drivers/:id/branches/:branchId/primary
DELETE /logistics/drivers/:id/branches/:branchId
```

## AuditLog

- `DRIVER_BRANCH_ASSIGNED`
- `DRIVER_BRANCH_REMOVED`
- `DRIVER_PRIMARY_BRANCH_CHANGED`

Metadados seguros: `driverId`, `driverCode`, `branchId` — sem dados pessoais.
