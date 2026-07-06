# Customer

Entidade global do tenant — cadastro mestre de clientes logísticos.

## Campos principais

| Campo | Descrição |
|-------|-----------|
| `code` | Código interno permanente (único por tenant, inclusive após soft delete) |
| `legalName` | Razão social |
| `tradeName` | Nome fantasia |
| `customerType` | Perfil logístico/comercial |
| `documentType` / `documentNumber` | Documento fiscal |
| `billingAddress*` | Endereço fiscal/cobrança (não operacional) |
| `status` | ACTIVE, INACTIVE, DISABLED |

## Unicidade

- `tenantId + code` — permanente (não reutilizável após soft delete)
- `tenantId + documentNumber` — único entre clientes **ativos** quando informado

## Regras

- Cliente deve ter ≥1 `CustomerBranch` ativo
- `code` não é editável após criação
- Endereço do Customer é fiscal/administrativo; locais operacionais vêm no módulo Locations

## ABAC (escopo por filial)

**Leitura:** usuário sem escopo global só vê clientes com `CustomerBranch` em filial acessível via `UserBranchAccess`. Filiais retornadas são filtradas ao escopo do usuário.

**Mutação global:** alterar dados cadastrais/fiscais, status, desativar, reativar ou excluir exige escopo global:

```txt
customers.manage | logistics.manage | organization.manage | *
```

**CustomerBranch:** gerenciar vínculos exige `customers.assign_branches` **e** escopo global (decisão Fase 1.1.1 — regra restritiva).

Escopo global identificado por padrões em `AuthorizationService.hasGlobalCustomerScope`.
