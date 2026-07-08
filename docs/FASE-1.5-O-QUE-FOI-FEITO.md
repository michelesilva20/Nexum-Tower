# Fase 1.5 — Routes + RouteBranch + RoutePoints — O que foi feito

**Data:** julho/2026  
**Status dev:** ✅ **10/10**  
**GO próxima fase:** Shipments/Trips  
**Produção:** ⚠️ **NO-GO** (RLS runtime com `nexum_app` + FORCE RLS)

---

## Decisão arquitetural

```txt
Route = entidade global do tenant
RouteBranch = vínculo operacional rota ↔ filial
RoutePoint = sequência ordenada de locais
```

- `originLocationId` / `destinationLocationId` mantidos para filtros/listagem, sincronizados do 1º ORIGIN e último DESTINATION.
- PUT `/points` substitui sequência completa de forma transacional.
- Compatibilidade LocationBranch por **interseção de filiais** (local deve compartilhar ao menos uma filial com a rota).
- Se `customerId` informado, todas as filiais da rota devem existir em CustomerBranch ativo.

---

## Entregas

| Área | Detalhe |
|------|---------|
| **Schema** | `Route`, `RouteBranch`, `RoutePoint` + 6 enums |
| **Migration** | `20260706180000_add_routes` |
| **RLS** | `11-routes-hardening.sql` + cenários 20–23 em `05-test-rls-isolation.sql` |
| **API** | `/logistics/routes` + branches + PUT points |
| **Frontend** | `/app/logistics/routes` (listagem, formulário, drawers detalhe/filiais/pontos) |
| **Seed** | 5 rotas demo no tenant `nexum-demo` |
| **Testes API** | 181 total (+31 routes) |
| **E2E** | 6/6 `pnpm test:e2e routes` |

---

## Validação executada

| Comando | Resultado |
|---------|-----------|
| `pnpm db:generate` | ✅ |
| `pnpm db:migrate:deploy` | ✅ migration `20260706180000_add_routes` |
| `pnpm db:seed` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm test:api` | ✅ 181/181 |
| `pnpm build` | ✅ |
| `pnpm test:e2e routes` | ✅ 6/6 |
| `pnpm security:rls:test` | ❌ `psql` ausente no Windows local — scripts preparados, runtime pendente |

---

## Seed demo

```txt
ROT_SANTOS_CUBATAO       → Santos + Matriz, cliente Vale, 3 pontos
ROT_PARANAGUA_TERMINAL   → Paranaguá
ROT_BOTUCATU_BASE        → Botucatu
ROT_MATRIZ_SANTOS        → Matriz + Santos
ROT_RONDONOPOLIS_PATIO   → Rondópolis
```

---

## Próximo passo

**Fase 1.6 — Shipments / Trips** (execução operacional sobre rotas cadastradas)
