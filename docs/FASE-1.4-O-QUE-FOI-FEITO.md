# Fase 1.4 — Vehicles + VehicleBranch — O que foi feito

**Data:** julho/2026  
**Status dev:** ✅ **10/10**  
**GO próxima fase:** Routes/RoutePoints  
**Produção:** ⚠️ **NO-GO** (RLS runtime)

---

## Decisão arquitetural

```txt
Vehicle = entidade global do tenant
VehicleBranch = vínculo operacional veículo ↔ filial
```

Placa normalizada: uppercase sem espaços/hífen (`ABC1D23`). AuditLog sem RENAVAM/chassi/rastreador completos.

---

## Entregas

| Área | Detalhe |
|------|---------|
| **Schema** | `Vehicle`, `VehicleBranch` + 8 enums |
| **Migration** | `20260706170000_add_vehicles` |
| **RLS** | `10-vehicles-hardening.sql` + cenários 17–19 em `05-test-rls-isolation.sql` |
| **API** | `apps/api/src/modules/vehicles/` — `/logistics/vehicles` |
| **Frontend** | `/app/logistics/vehicles` |
| **Seed** | 6 veículos demo fictícios |
| **Testes API** | **150/150** (+19 vehicles) |
| **E2E** | **7/7** `pnpm test:e2e vehicles` |

---

## Comandos executados

| Comando | Resultado |
|---------|-----------|
| `pnpm db:generate` | ✅ |
| `pnpm db:migrate:deploy` | ✅ |
| `pnpm db:seed` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm test:api` | ✅ **150/150** |
| `pnpm build` | ✅ |
| `pnpm test:e2e vehicles` | ✅ **7/7** |
| `pnpm security:rls:test` | ❌ `psql` ausente (Windows) |

---

## Seed demo

```txt
VEI_CAVALO_SANTOS_001      → Santos (+ Matriz)
VEI_CARRETA_SANTOS_001     → Santos (+ Matriz)
VEI_TRUCK_BOTUCATU_001     → Botucatu
VEI_VAN_MATRIZ_001         → Matriz
VEI_CARRETA_PARANAGUA_001  → Paranaguá
VEI_CAVALO_RONDONOPOLIS_001 → Rondópolis
```

---

## Limitações

Sem composição cavalo+carreta, tracking, telemetria, manutenção ou upload de documentos.

---

## Próximo passo

**Fase 1.5 — Routes + RoutePoints**
