# Feature Flags — Nexum Tower

Ativação/desativação de funcionalidades por tenant.

## 1. Modelo

- `Feature` (global): `key`, `name`, `description?`, `module`.
- `TenantFeature` (por tenant): `tenantId`, `featureId`, `enabled`, `config?` (JSON) — único por `(tenantId, featureId)`.

Estado efetivo: `TenantFeature.enabled ?? false`.

## 2. Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/features` | `features.read` |
| GET | `/features/tenant` | `features.read` |
| PATCH | `/features/tenant/:featureKey` | `features.manage` |

`PATCH` recebe `{ enabled: boolean, config?: object }`.

## 3. Auditoria

Alterações registram `FEATURE_FLAG_UPDATED` com `key`, `oldEnabled`, `newEnabled`.

## 4. Catálogo inicial (seed)

`nexum_ai.enabled`, `customer_portal.enabled`, `driver_portal.enabled`, `advanced_rbac.enabled`, `audit_export.enabled`, `map_tracking.enabled`, `operational_dashboard.enabled`. Fonte: `packages/database/prisma/seed-data/settings.ts`.

## 5. Settings vs Feature Flags

- **Settings**: parâmetros de comportamento (valores). Ver [SETTINGS.md](./SETTINGS.md).
- **Feature Flags**: liga/desliga módulos e capacidades inteiras.

## 6. Como adicionar uma feature

1. Adicionar entrada em `FEATURE_DEFINITIONS`.
2. Rodar `pnpm db:seed`.
3. Verificar `enabled` no backend antes de expor a funcionalidade.
