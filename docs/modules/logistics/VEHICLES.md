# Veículos (Vehicle)

Cadastro mestre logístico de veículos por tenant, com escopo operacional por filial via `VehicleBranch`.

## Decisão arquitetural

```txt
Vehicle = entidade global do tenant
VehicleBranch = vínculo operacional veículo ↔ filial
```

Um veículo pode operar em várias filiais sem duplicar placa, RENAVAM ou chassi.

## Normalização de placa

Placas são armazenadas em **uppercase sem espaços nem hífen**:

```txt
abc1d23  → ABC1D23
ABC-1D23 → ABC1D23
```

O frontend pode exibir formatada; a API normaliza na criação/edição.

## Unicidade

- `tenantId + code` — permanente
- `tenantId + plate` — único entre registros ativos
- `tenantId + renavam` — único quando informado (ativos)
- `tenantId + chassisNumber` — único quando informado (ativos)
- `tenantId + fleetNumber` — único quando informado (ativos)

## Regras de negócio

- Criação exige `branchIds` com ao menos uma filial válida
- Não é permitido remover a última filial ativa
- Apenas uma `VehicleBranch` ativa pode ser `isPrimary = true`
- Números de peso, capacidade, hodômetro e horímetro devem ser ≥ 0

## Dados técnicos / auditoria

RENAVAM, chassi, motor e rastreador **não** entram completos em `AuditLog.metadata`.

## ABAC

| Operação | Escopo |
|----------|--------|
| GET | `vehicles.read` ou `logistics.read` + filtro por `VehicleBranch` |
| POST/PATCH/disable/delete | Escopo global |
| Gerenciar filiais | Escopo global + `vehicles.assign_branches` |

## RLS

Scripts em `packages/database/sql/security/10-vehicles-hardening.sql`.

Produção: **NO-GO** até `nexum_app` + FORCE RLS + `pnpm security:rls:test`.

## Limitações desta fase

Sem composição cavalo+carreta, tracking real, telemetria, manutenção ou upload de documentos.
