# Fase 1.3 — Drivers + DriverBranch — O que foi feito

**Data:** julho/2026  
**Status dev:** ✅ **10/10**  
**GO próxima fase:** Vehicles  
**Produção:** ⚠️ **NO-GO** (RLS runtime)

---

## Decisão arquitetural

```txt
Driver = entidade global do tenant
DriverBranch = vínculo operacional motorista ↔ filial
```

Motorista ACTIVE exige CNH completa. AuditLog sem dados pessoais sensíveis.

---

## Entregas

| Área | Detalhe |
|------|---------|
| **Schema** | `Driver`, `DriverBranch` + 6 enums |
| **Migration** | `20260706160000_add_drivers` |
| **RLS** | `09-drivers-hardening.sql` + cenários 14–16 em `05-test-rls-isolation.sql` |
| **API** | `apps/api/src/modules/drivers/` — `/logistics/drivers` |
| **Auth** | `hasGlobalDriverScope`, `assertDriverGlobalMutationAllowed`, etc. |
| **Audit** | `DRIVER_*` (8 ações) |
| **Seed** | 5 motoristas demo fictícios |
| **Frontend** | `/app/logistics/drivers` |
| **Testes API** | **131/131** (+19 drivers) |
| **E2E** | **7/7** `pnpm test:e2e drivers` |
| **Docs** | `DRIVERS.md`, `DRIVER-BRANCH.md`, GO-NO-GO, API, PERMISSIONS, RLS |

---

## Comandos executados

| Comando | Resultado |
|---------|-----------|
| `pnpm db:generate` | ✅ |
| `pnpm db:migrate:deploy` | ✅ |
| `pnpm db:seed` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm test:api` | ✅ **131/131** |
| `pnpm build` | ✅ |
| `pnpm test:e2e drivers` | ✅ **7/7** |
| `pnpm security:rls:test` | ❌ `psql` ausente (Windows) |

---

## Seed demo

```txt
MOT_JOAO_SANTOS       → Santos (+ Matriz)
MOT_CARLOS_BOTUCATU   → Botucatu
MOT_MARCOS_PARANAGUA  → Paranaguá
MOT_ROBERTO_MATRIZ    → Matriz
MOT_FERNANDO_RONDONOPOLIS → Rondópolis
```

---

## Pendências

- RLS runtime com `nexum_app` + FORCE RLS
- `pnpm security:rls:test` em CI/staging
- Upload/OCR CNH, portal motorista, viagens — fases futuras

---

## Próximo passo

**Fase 1.4 — Vehicles + VehicleBranch** (mesmo padrão arquitetural).
