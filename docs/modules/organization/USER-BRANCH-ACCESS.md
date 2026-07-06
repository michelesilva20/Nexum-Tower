# User Branch Access

> Hardening: [FASE-1.0.1-HARDENING.md](../../FASE-1.0.1-HARDENING.md)

## Modelo

`UserBranchAccess` — vínculo N:N entre `User` e `Branch` no mesmo tenant.

- Unicidade: `tenantId + userId + branchId`
- Escopos: `MEMBER` | `MANAGER` | `ADMIN` (preparação ABAC futuro)

## Regras de segurança

| Regra | Implementação |
|-------|----------------|
| Não vincular usuário de outro tenant | `assertUserInTenant` |
| Não vincular branch de outro tenant | `assertBranchBelongsToTenant` + `getExisting` |
| Duplicidade bloqueada | Constraint única + upsert |
| Listar usuários da filial | `GET /branches/:id/users` — ABAC na filial |
| Vincular/remover | `branches.assign_users` + ABAC na filial |

Todas as operações usam `currentUser.tenantId` — **nunca** `tenantId` do body.

## Escopo de leitura vs administração

- **Leitura** (`branches.read`): global ou filiais vinculadas
- **Vínculo usuário** (`branches.assign_users`): requer acesso à filial (global ou UserBranchAccess)
- **CRUD da entidade Branch**: apenas escopo global (admin master)

## Seed demo

| Usuário | Filiais | Escopo |
|---------|---------|--------|
| `operacao@nexumtower.local` | Santos, Paranaguá | MANAGER |
| `operador@nexumtower.local` | Botucatu | MEMBER |

Owner/admin com `*` ou `branches.manage` não precisa de vínculo explícito.

## E2E

Ver `tests/e2e/branches.spec.ts` — validação de escopo operacao/operador.
