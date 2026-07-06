# LocationBranch — Vínculo operacional

> Fase 1.2 · julho/2026

## Modelo

Vínculo N:N entre `Location` e `Branch` com escopo operacional por filial.

## Regras

| Regra | Detalhe |
|-------|---------|
| Unicidade | `tenantId + locationId + branchId` |
| Filial principal | Uma `isPrimary = true` ativa por location (índice parcial SQL) |
| Local órfão | Proibido — ao menos uma filial ativa |
| Remoção | Não remove última filial ativa |
| Customer | Se location tem `customerId`, branch deve existir em `CustomerBranch` |

## Gerenciamento

Apenas escopo global + `locations.assign_branches`.

## AuditLog

- `LOCATION_BRANCH_ASSIGNED`
- `LOCATION_BRANCH_REMOVED`
- `LOCATION_PRIMARY_BRANCH_CHANGED`
