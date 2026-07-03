# Admin UI — Nexum Tower

Documentação completa da interface administrativa do Nexum Tower.

---

## Rotas disponíveis

| Rota | Componente | Permissão |
|------|-----------|-----------|
| `/app` | `AppOverviewPage` | `dashboard.read` |
| `/app/admin/users` | `UsersAdminPage` | `users.read` |
| `/app/admin/groups` | `GroupsAdminPage` | `groups.read` |
| `/app/admin/roles` | `RolesAdminPage` | `roles.read` |
| `/app/admin/permissions` | `PermissionsAdminPage` | `permissions.read` |
| `/app/admin/audit` | `AuditAdminPage` | `audit.read` |
| `/app/settings` | `SettingsHubPage` | `settings.read` |
| `/app/settings/security` | `SecurityConsolePage` | `security.read` |
| `/app/settings/parameters` | `SettingsParametersPage` | `settings.read` |
| `/app/settings/features` | `SettingsFeaturesPage` | `features.read` |
| `/app/security/sessions` | `SessionsPage` | `sessions.read` |
| `/access-denied` | `AccessDeniedPage` | — |

> Rotas legadas `/app/users`, `/app/groups`, `/app/roles`, `/app/permissions`, `/app/audit`
> continuam funcionando como aliases para manter compatibilidade.

---

## Gerenciamento de Usuários (`/app/admin/users`)

### Funcionalidades

- Listagem com busca e filtro por status (ACTIVE, INVITED, DISABLED)
- Cards de resumo: ativos, convidados, desativados, total
- Criar usuário (status inicial: INVITED)
- Desativar / reativar usuário
- Drawer de detalhes com abas:
  - **Dados**: nome, e-mail, status, tenant, datas
  - **Roles**: roles diretas, adicionar/remover
  - **Grupos**: grupos do usuário, adicionar/remover
  - **Overrides**: permissões especiais (ALLOW/DENY)
  - **Permissões efetivas**: lista de todas as permissões resolvidas

### Overrides de permissão

```tsx
// Adicionar override DENY
<AddOverrideModal userId={id} effect="DENY" />
// Aviso visual automático ao selecionar DENY
```

**Importante**: DENY sempre prevalece sobre ALLOW independente de roles/grupos.

---

## Gerenciamento de Grupos (`/app/admin/groups`)

- CRUD completo de grupos
- Vincular/remover roles do grupo
- Visualizar membros com status

---

## Gerenciamento de Roles (`/app/admin/roles`)

- CRUD de roles customizadas
- Roles de sistema (`isSystem: true`) não podem ser excluídas
- Adicionar/remover permissões da role

---

## Permissões (`/app/admin/permissions`)

- Catálogo somente leitura (criado por seed)
- Filtro por módulo e busca por chave
- Permissões agrupadas por módulo

---

## Auditoria (`/app/admin/audit`)

- Log de todos os eventos de segurança
- Filtros por ação e entidade
- Drawer de detalhes com oldValue, newValue, metadata, requestId

---

## Settings Hub (`/app/settings`)

Cards de navegação para:
- Console de Segurança
- Parâmetros da Plataforma
- Feature Flags
- Auditoria
- Sessões

---

## Parâmetros (`/app/settings/parameters`)

- Edição de configurações por categoria
- Tipos suportados: BOOLEAN (switch), NUMBER, STRING, SELECT, JSON
- Configurações sensíveis exigem permissão `settings.security.update`
- Cada alteração gera audit log

---

## Feature Flags (`/app/settings/features`)

- Toggle por feature flag
- Filtro por módulo
- Indicador visual de "valor padrão alterado"
- Cada alteração gera audit log

---

## Sessões (`/app/security/sessions`)

- Lista sessões ativas do usuário/tenant
- Revogar sessão individual
- Revogar todas as sessões
- Identificação da sessão atual

---

## Console de Segurança (`/app/settings/security`)

- Checklist de segurança visual
- Política de sessão atual
- Status do RLS por tabela
- Proteções ativas listadas
- Links rápidos para auditoria, sessões, parâmetros

---

## Permission Gates

```tsx
import {
  PermissionGate,
  AnyPermissionGate,
  FeatureGate,
  RoleGate,
  usePermission,
  useAnyPermission,
} from "@/components/app/permission-gate";

// Exige UMA permissão
<PermissionGate permission="users.create">
  <Button>Criar usuário</Button>
</PermissionGate>

// Exige QUALQUER UMA das permissões
<AnyPermissionGate permissions={["users.create", "users.update"]}>
  <Button>Editar</Button>
</AnyPermissionGate>

// Exige feature flag ativa
<FeatureGate feature="advanced_rbac.enabled">
  <AdvancedRBACPanel />
</FeatureGate>

// Hook para uso em lógica
const canCreate = usePermission("users.create");
const canEdit = useAnyPermission(["users.update", "users.manage_roles"]);
```

---

## Navegação por permissão

O arquivo `apps/web/lib/navigation.ts` controla a visibilidade dos itens de menu:

```typescript
{
  key: "users",
  href: "/app/admin/users",
  icon: Users,
  requiredPermission: "users.read", // oculto se usuário não tem essa permissão
}
```

**Importante**: o frontend oculta por UX. O backend é a fonte real de autorização.

---

## Design System usado

Todos os componentes do Admin UI usam o design system interno:

- `NexumCard` — cards e containers
- `NexumDataTable` — tabelas paginadas
- `NexumDrawer` — painéis laterais de detalhes
- `NexumModal` / `NexumConfirmModal` — modais de formulário e confirmação
- `NexumBadge` — status e labels
- `NexumButton` — botões com variantes (primary, ghost, danger, warning)
- `NexumInput` / `NexumSelect` / `NexumTextarea` / `NexumSwitch` — inputs
- `NexumFormField` — wrapper de campos com label e erro
- `NexumTabs` — navegação por abas no drawer
- `NexumToast` / `useNexumToast` — notificações
- `NexumMetricCard` — cards de métricas
- `NexumSkeleton` — loading states
