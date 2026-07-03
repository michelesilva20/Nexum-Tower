# RBAC — Nexum Tower

## Modelo

```txt
Tenant
  └── Users
        ├── UserRoles → Role → Permissions
        ├── GroupMembers → Group → GroupRoles → Role → Permissions
        └── UserPermissionOverride (ALLOW | DENY)
```

## Resolução de permissões

Ordem aplicada em `RbacService.getUserPermissions()`:

1. Permissões dos papéis diretos do usuário
2. Permissões dos papéis dos grupos do usuário
3. Overrides `ALLOW` adicionam permissão
4. Overrides `DENY` removem permissão
5. Lista deduplicada e ordenada

## Formato de permissão

```txt
resource.action
```

Exemplos: `trips.read`, `users.invite`, `rbac.manage`

### Wildcards (suporte inicial)

- `trips.*` — todas as permissões que começam com `trips.`
- `*` — todas as permissões (Owner no seed)

Implementado em `@nexum-tower/shared` (`permissionMatches`, `hasAllPermissions`, `hasAnyPermission`). No backend, `RbacService` expõe `userHasPermission`, `userHasAllPermissions` e `userHasAnyPermission`.

> `RbacService` cumpre o papel de "resolvedor de permissões" (equivalente ao `PermissionResolverService` de outras arquiteturas): papéis diretos → papéis de grupos → overrides, com **DENY prevalecendo sobre ALLOW**. Coberto por testes em `rbac.service.spec.ts`.

## ABAC / object-level (AuthorizationService)

Além do RBAC ("o que pode fazer"), o `AuthorizationService` (`apps/api/src/modules/authorization/`) decide o contexto ("pode fazer neste objeto"):

- `assertSameTenant(objectTenantId, userTenantId)` — bloqueia objetos de outro tenant
- `canManageUser(actor, target)` — mesmo tenant
- `assertCanModifyRole(actor, role)` — bloqueia papéis `isSystem` e de outro tenant

Além disso, o `UsersService` protege o **último owner** (não permite desativar/remover/retirar o papel owner do último owner ativo).

## Papéis seedados (por tenant)

| Slug | Nome |
|------|------|
| owner | Owner |
| tenant-admin | Tenant Admin |
| operations-manager | Operations Manager |
| logistics-operator | Logistics Operator |
| finance-analyst | Finance Analyst |
| customer-user | Customer User |
| driver | Driver |
| viewer | Viewer |

## Grupos seedados

| Grupo | Papel vinculado |
|-------|-----------------|
| Administradores | Tenant Admin |
| Operação | Operations Manager |
| Financeiro | Finance Analyst |
| Clientes | Customer User |
| Motoristas | Driver |
| Visualizadores | Viewer |

Usuários de teste (seed) — senha `test123`, exceto admin (`admin123`):

| E-mail | Papel |
|--------|-------|
| `admin@nexumtower.local` | Owner |
| `tenantadmin@nexumtower.local` | Tenant Admin |
| `operacao@nexumtower.local` | Operations Manager |
| `operador@nexumtower.local` | Logistics Operator |
| `financeiro@nexumtower.local` | Finance Analyst |
| `visualizador@nexumtower.local` | Viewer |
| `cliente@nexumtower.local` | Customer User |
| `motorista@nexumtower.local` | Driver |

Ver [Autenticação](./AUTHENTICATION.md) para detalhes.

## Proteger rota no backend

```typescript
import { RequirePermissions } from "../common/decorators/auth.decorators";

@Get()
@RequirePermissions("users.read")
listUsers() {
  // ...
}
```

Guards globais:

- `JwtAuthGuard` — exige JWT (exceto `@Public()`)
- `PermissionsGuard` — exige permissões quando `@RequirePermissions` está presente

## Endpoints RBAC

### Leitura (aliases legados preservados)

| Rota | Permissão |
|------|-----------|
| GET `/rbac/permissions` · `/permissions` | `permissions.read` |
| GET `/rbac/roles` · `/roles` | `roles.read` |
| GET `/rbac/groups` · `/groups` | `groups.read` |
| GET `/permissions/modules` | `permissions.read` |
| GET `/audit` · `/audit/logs` | `audit.read` |

> As rotas `/rbac/*` continuam funcionando como aliases de compatibilidade; os novos controllers REST canônicos são `/permissions`, `/roles`, `/groups`, `/users`.

### CRUD administrativo

| Rota | Permissão |
|------|-----------|
| `GET/POST /users`, `GET/PATCH/DELETE /users/:id` | `users.read` / `users.create` / `users.update` / `users.delete` |
| `PATCH /users/:id/status` | `users.disable` |
| `POST/DELETE /users/:id/roles[/:roleId]` | `users.manage_roles` |
| `POST/DELETE /users/:id/groups[/:groupId]` | `users.manage_groups` |
| `POST/DELETE /users/:id/permission-overrides[/:id]` | `users.manage_overrides` |
| `GET/POST/PATCH/DELETE /groups[...]` | `groups.read/create/update/delete` |
| `POST/DELETE /groups/:id/roles[/:roleId]` | `groups.manage_roles` |
| `GET/POST/PATCH/DELETE /roles[...]` | `roles.read/create/update/delete` |
| `POST/DELETE /roles/:id/permissions[/:permissionId]` | `roles.manage_permissions` |
| `GET/PATCH /settings[...]` | `settings.read` / `settings.update` |
| `GET/PATCH /features[...]` | `features.read` / `features.manage` |

Regras de negócio:

- Criação de usuário sem senha → status `INVITED` (sem serviço de e-mail; senha definida depois via `PATCH`).
- `DELETE /users/:id` é **soft delete** (`status = DISABLED`); dado nunca é perdido.
- Papéis `isSystem` não podem ser alterados/removidos.

## UI administrativa (dashboard)

Rotas em `apps/web/app/[locale]/app/`:

| Rota | Permissão mínima | Descrição |
|------|------------------|-----------|
| `/app` | autenticado | Visão geral |
| `/app/users` | `users.read` | Listagem de usuários |
| `/app/roles` | `roles.read` | Listagem de papéis |
| `/app/groups` | `groups.read` | Listagem de grupos |
| `/app/permissions` | `permissions.read` | Catálogo de permissões |
| `/app/audit` | `audit.read` | Logs de auditoria |

Navegação filtrada por permissão em `app-shell.tsx`. O **backend** já expõe CRUD completo (usuários, grupos, papéis, overrides, settings, features); as **telas de escrita** ficam para a Etapa 2 (formulários administrativos).

## Modo ANY vs ALL

- `@RequirePermissions("a", "b")` — exige **todas** (ALL)
- `@RequireAnyPermissions("a", "b")` — exige **pelo menos uma** (ANY)

## Tenant isolation

Toda query sensível deve filtrar por `tenantId` do usuário autenticado (`AuthUserPayload.tenantId`).

Exemplo:

```typescript
this.prisma.client.user.findMany({
  where: { tenantId: user.tenantId },
});
```

## Próximos passos

- [ ] CRUD de roles/grupos/overrides (backend + UI)
- [ ] CRUD de usuários (convite, edição, desativação)
- [ ] Escopo por recurso (ex.: `shipments.read_own`)
