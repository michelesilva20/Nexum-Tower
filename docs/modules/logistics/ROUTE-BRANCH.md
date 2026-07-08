# RouteBranch

Vínculo operacional entre rota (`Route`) e filial (`Branch`).

Mesmo padrão de CustomerBranch, LocationBranch, DriverBranch e VehicleBranch.

## Regras

- Ao menos uma filial ativa por rota operacional
- Apenas uma filial `isPrimary = true` por rota ativa
- Gerenciamento exige escopo global + `routes.assign_branches`

## Endpoints

```txt
GET    /logistics/routes/:id/branches
POST   /logistics/routes/:id/branches
PATCH  /logistics/routes/:id/branches/:branchId/primary
DELETE /logistics/routes/:id/branches/:branchId
```
