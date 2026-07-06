# Organization Permissions

> Hardening: [FASE-1.0.1-HARDENING.md](../../FASE-1.0.1-HARDENING.md)

## Catálogo

| Key | Descrição |
|-----|-----------|
| `branches.read` | Listar/visualizar filiais |
| `branches.create` | Criar filiais (requer escopo global) |
| `branches.update` | Editar filiais (requer escopo global) |
| `branches.disable` | Desativar/reativar (requer escopo global) |
| `branches.delete` | Soft delete (requer escopo global) |
| `branches.manage` | Escopo global de filiais no tenant |
| `branches.assign_users` | Vincular usuários a filiais |
| `organization.read` | Leitura estrutura organizacional |
| `organization.manage` | Gestão organizacional (escopo global) |

## Escopo global vs limitado

| Permissão RBAC | Escopo ABAC adicional |
|----------------|----------------------|
| `branches.read` + escopo global | Todas as filiais do tenant |
| `branches.read` sem escopo global | Apenas filiais em UserBranchAccess |
| `branches.create/update/disable/delete` | **Sempre** escopo global |
| `branches.assign_users` | Escopo global **ou** acesso à filial alvo |

## Wildcard `*` (owner)

- Concedido ao role **owner** via `RbacService` (`return ["*"]`)
- Significa permissão total **dentro do tenant** do JWT
- **Não** é Platform Admin — não há endpoints cross-tenant expostos ao owner
- Avaliação via `permissionMatches(granted, required)` em `@nexum-tower/shared`

### Recomendação futura (não implementada)

Prefixos explícitos para evitar ambiguidade:

```txt
platform.*
tenant.*
organization.*
branches.*
```

## Roles (seed)

| Role | Branches |
|------|----------|
| `owner` | `*` (tenant-scoped) |
| `tenant-admin` | `branches.*`, `organization.*` |
| `operations-manager` | `branches.read`, `organization.read` |

Nenhuma role nova criada.
