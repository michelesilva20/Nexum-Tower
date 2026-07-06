# Motoristas (Driver)

Cadastro mestre logístico de motoristas por tenant, com escopo operacional por filial via `DriverBranch`.

## Decisão arquitetural

```txt
Driver = entidade global do tenant
DriverBranch = vínculo operacional motorista ↔ filial
```

Um motorista pode operar em várias filiais sem duplicar cadastro pessoal, CNH ou documentos.

## Campos principais

| Campo | Descrição |
|-------|-----------|
| `code` | Código interno permanente (único por tenant, inclusive após soft delete) |
| `fullName` | Nome completo |
| `preferredName` | Nome operacional/apelido |
| `driverType` | Tipo operacional (INTERNAL, THIRD_PARTY, etc.) |
| `employmentType` | Vínculo com a empresa |
| `documentType` / `documentNumber` | Documento pessoal (único no tenant quando informado) |
| `licenseNumber` / `licenseCategory` / `licenseExpiresAt` | CNH (única no tenant quando informada) |
| `moppCertified` / `moppExpiresAt` | Certificação MOPP |
| `availabilityStatus` | Disponibilidade operacional |
| `status` | Status cadastral |

## Unicidade

- `tenantId + code` — permanente
- `tenantId + documentNumber` — único entre registros ativos (`deletedAt IS NULL`)
- `tenantId + licenseNumber` — único entre registros ativos

## Regras de negócio

- Motorista **ACTIVE** exige `licenseNumber`, `licenseCategory` e `licenseExpiresAt`
- `moppExpiresAt` obrigatório se `moppCertified = true`
- `terminationDate` não pode ser anterior a `admissionDate`
- Criação exige `branchIds` com ao menos uma filial válida
- Não é permitido remover a última filial ativa
- Apenas uma `DriverBranch` ativa pode ser `isPrimary = true` por motorista

## LGPD / auditoria

Dados pessoais (CPF, CNH, endereço, telefone) **não** são registrados em `AuditLog.metadata`.

## API

Prefixo: `/logistics/drivers`

Ver [API.md](./API.md) e [DRIVER-BRANCH.md](./DRIVER-BRANCH.md).

## ABAC

| Operação | Escopo |
|----------|--------|
| GET list/detail | `drivers.read` ou `logistics.read` + filtro por `DriverBranch` |
| POST/PATCH/disable/delete | Escopo global (`drivers.manage`, `logistics.manage`, `*`) |
| Gerenciar filiais | Escopo global + `drivers.assign_branches` |

## RLS

Scripts em `packages/database/sql/security/09-drivers-hardening.sql`.

Produção: **NO-GO** até `nexum_app` + FORCE RLS + `pnpm security:rls:test`.
