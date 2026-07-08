# RLS — Logistics Core

Policies tenant isolation via `app.current_tenant_id`:

| Tabela | Policy |
|--------|--------|
| Customer | `Customer_tenant_isolation` |
| CustomerBranch | `CustomerBranch_tenant_isolation` |
| Location | `Location_tenant_isolation` |
| LocationBranch | `LocationBranch_tenant_isolation` |
| Driver | `Driver_tenant_isolation` |
| DriverBranch | `DriverBranch_tenant_isolation` |
| Vehicle | `Vehicle_tenant_isolation` |
| VehicleBranch | `VehicleBranch_tenant_isolation` |
| Route | `Route_tenant_isolation` |
| RouteBranch | `RouteBranch_tenant_isolation` |
| RoutePoint | `RoutePoint_tenant_isolation` |

## Scripts

| Migration | Hardening |
|-----------|-----------|
| `20260706140000_add_customers` | `07-customers-hardening.sql` |
| `20260706150000_add_locations` | `08-locations-hardening.sql` |
| `20260706160000_add_drivers` | `09-drivers-hardening.sql` |
| `20260706170000_add_vehicles` | `10-vehicles-hardening.sql` |
| `20260706180000_add_routes` | `11-routes-hardening.sql` |

- Core enable: `03-enable-rls-core.sql`
- Teste: `05-test-rls-isolation.sql` (cenários Customer → RoutePoint)

## Runtime

FORCE RLS + usuário `nexum_app` ainda não ativos em dev local.

Produção permanece NO-GO até `pnpm security:rls:test` passar com `nexum_app`.
