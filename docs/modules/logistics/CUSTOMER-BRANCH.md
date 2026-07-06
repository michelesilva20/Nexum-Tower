# CustomerBranch

Vínculo operacional entre `Customer` e `Branch`.

## Campos

| Campo | Descrição |
|-------|-----------|
| `customerId` | Cliente |
| `branchId` | Filial |
| `isPrimary` | Filial principal do cliente |
| `status` | ACTIVE, INACTIVE, DISABLED |

## Regras

- `tenantId + customerId + branchId` único
- Apenas uma filial ativa `isPrimary = true` por customer (índice parcial)
- Não permitir remover a última filial ativa
- Criação exige `branchIds` com ≥1 filial válida do tenant

## Permissão

Alteração de vínculos: `customers.assign_branches` **+ escopo global** (Fase 1.1.1).

Usuários com escopo limitado por filial **não** gerenciam CustomerBranch — apenas visualizam vínculos dentro do seu escopo na leitura.

## AuditLog

- `CUSTOMER_BRANCH_ASSIGNED`
- `CUSTOMER_BRANCH_REMOVED`
- `CUSTOMER_PRIMARY_BRANCH_CHANGED`
