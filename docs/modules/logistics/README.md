# Logistics Core — Módulo Logístico

Cadastros mestres do Nexum Tower (Fases 1.1 → 1.3).

## Decisão arquitetural (padrão)

```txt
Entidade global do tenant  (Customer, Location, …)
*Branch                     = vínculo operacional ↔ filial
```

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [CUSTOMERS.md](./CUSTOMERS.md) | Clientes |
| [CUSTOMER-BRANCH.md](./CUSTOMER-BRANCH.md) | Vínculo cliente ↔ filial |
| [LOCATIONS.md](./LOCATIONS.md) | Locais operacionais |
| [LOCATION-BRANCH.md](./LOCATION-BRANCH.md) | Vínculo local ↔ filial |
| [DRIVERS.md](./DRIVERS.md) | Motoristas |
| [DRIVER-BRANCH.md](./DRIVER-BRANCH.md) | Vínculo motorista ↔ filial |
| [PERMISSIONS.md](./PERMISSIONS.md) | RBAC |
| [RLS.md](./RLS.md) | Policies tenant isolation |
| [API.md](./API.md) | Endpoints REST |

## Status

| Módulo | API | Tela | ABAC | E2E | Dev |
|--------|-----|------|------|-----|-----|
| Customers | `/logistics/customers` | `/app/logistics/customers` | ✅ hardened | 7/7 | **10/10** |
| Locations | `/logistics/locations` | `/app/logistics/locations` | ✅ hardened | 7/7 | **10/10** |
| Drivers | `/logistics/drivers` | `/app/logistics/drivers` | ✅ hardened | 7/7 | **10/10** |

Produção: **NO-GO** até FORCE RLS + `security:rls:test` com `nexum_app`

## Próximos módulos

Vehicles → Routes → RoutePoints
