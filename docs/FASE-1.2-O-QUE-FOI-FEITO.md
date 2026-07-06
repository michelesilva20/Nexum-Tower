# Fase 1.2 — O que foi feito (Locations + LocationBranch)

> **Documento explicativo** · julho/2026  
> **Escopo:** segundo cadastro mestre logístico — Locais Operacionais  
> **Status:** ✅ **10/10 dev** · E2E **7/7** · testes API **112/112** · **GO Drivers** · **NO-GO produção**

Complementa [FASE-1.1.1-O-QUE-FOI-FEITO.md](./FASE-1.1.1-O-QUE-FOI-FEITO.md).

---

## Decisão arquitetural

```txt
Location        = entidade global do tenant
LocationBranch  = vínculo operacional local ↔ filial
```

`Location.customerId` opcional — obrigatório quando `locationType = CUSTOMER_SITE`.

Regra de coerência: filiais do Location devem existir em `CustomerBranch` quando há `customerId`.

---

## Entregas principais

### Banco

- Models `Location`, `LocationBranch`
- Enums `LocationStatus`, `LocationType`, `LocationBranchStatus`
- Migration `20260706150000_add_locations`
- Índice parcial: uma `isPrimary` ativa por location
- `tenantId + code` único permanente

### API

- Módulo `apps/api/src/modules/locations/`
- Rotas `/logistics/locations` (CRUD + branches)
- ABAC hardened (mesmo padrão Customers 1.1.1)
- 14 testes unitários em `locations.service.spec.ts`

### Frontend

- `/app/logistics/locations`
- Sidebar Logística → **Locais**
- Formulário completo em drawer (7 seções)
- PermissionGate + escopo global para mutações

### Seed demo (6 locais)

`PORTO_SANTOS`, `CD_VALE_CUBATAO`, `FABRICA_SUZANO_LIMEIRA`, `TERMINAL_PARANAGUA`, `BASE_BOTUCATU`, `PATIO_RONDONOPOLIS`

### RLS

- Migration + `08-locations-hardening.sql`

---

## Comandos executados

| Comando | Resultado |
|---------|-----------|
| `pnpm db:generate` | ✅ |
| `pnpm db:migrate:deploy` | ✅ |
| `pnpm db:seed` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm test:api` | ✅ **112/112** |
| `pnpm build` | ✅ |
| `pnpm test:e2e locations` | ✅ **7/7** |
| `pnpm security:rls:test` | ❌ `psql` ausente (Windows) |

---

## Próximo passo

**Drivers** — terceiro cadastro logístico, replicando padrão global + filial + ABAC hardened.
