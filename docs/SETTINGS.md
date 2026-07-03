# Parâmetros por Tenant (Settings) — Nexum Tower

Configurações ajustáveis por tenant, com catálogo global de definições e valores por tenant.

## 1. Modelo

- `SettingDefinition` (global): `key`, `module`, `label`, `description?`, `valueType` (`STRING|NUMBER|BOOLEAN|JSON|SELECT`), `defaultValue?`, `options?`, `isTenantScoped`, `isSensitive`.
- `TenantSetting` (por tenant): `tenantId`, `definitionId`, `value` — único por `(tenantId, definitionId)`.

O valor efetivo é `TenantSetting.value ?? SettingDefinition.defaultValue`.

## 2. Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/settings` | `settings.read` |
| GET | `/settings/modules` | `settings.read` |
| GET | `/settings/:key` | `settings.read` |
| PATCH | `/settings/:key` | `settings.update` (+ `settings.security.update` se sensível) |

## 3. Parâmetros sensíveis

Definições com `isSensitive: true` (ex.: `security.require_mfa`, `security.max_login_attempts`) só podem ser alteradas por quem tem `settings.security.update`. A tentativa sem a permissão retorna 403.

## 4. Validação

O valor é validado contra `valueType` (boolean/number/string/select-options). `SELECT` exige valor dentro de `options`.

## 5. Auditoria

Toda alteração registra `SETTING_UPDATED` com `key`, `module`, `oldValue`, `newValue`.

## 6. Catálogo inicial (seed)

Módulos: `security`, `access`, `sessions`, `users`, `audit`, `operational`, `sla`, `incidents`, `costs`, `documents`, `notifications`. Fonte: `packages/database/prisma/seed-data/settings.ts` (idempotente).

## 7. Como adicionar um parâmetro

1. Adicionar entrada em `SETTING_DEFINITIONS`.
2. Rodar `pnpm db:seed` (upsert idempotente).
3. Consumir via `GET /settings/:key` no backend/serviço que precisa do valor.
