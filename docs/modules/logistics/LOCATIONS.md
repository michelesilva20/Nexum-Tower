# Locations — Locais Operacionais

> Módulo logístico · Fase 1.2 · julho/2026

## Decisão arquitetural

```txt
Location        = entidade global do tenant
LocationBranch  = vínculo operacional local ↔ filial
```

`Location.customerId` é **opcional**. Obrigatório quando `locationType = CUSTOMER_SITE`.

## ABAC (Fase 1.2 — padrão Customers hardened)

| Ação | Regra |
|------|--------|
| Leitura | `LocationBranch` ∩ `UserBranchAccess` |
| Mutação global | Escopo global (`locations.manage`, `logistics.manage`, `organization.manage`, `*`) |
| LocationBranch | `locations.assign_branches` + escopo global |

## Integração Customer

Quando `customerId` informado, `branchIds` / `LocationBranch` devem ser compatíveis com `CustomerBranch` ativas do cliente.

## Campos preparatórios (sem mapa nesta fase)

- `latitude`, `longitude`, `geofenceRadiusMeters` — uso futuro em mapa, tracking e geofence

## Unicidade

- `tenantId + code` — permanente (não reutilizável após soft delete)

## Ver também

- [LOCATION-BRANCH.md](./LOCATION-BRANCH.md)
- [API.md](./API.md)
- [PERMISSIONS.md](./PERMISSIONS.md)
- [RLS.md](./RLS.md)
