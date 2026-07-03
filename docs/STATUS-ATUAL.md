# Status atual — Nexum Tower

Documento de referência para entender **onde o projeto está hoje** e apoiar o planejamento dos próximos passos.

> Última revisão: julho/2026 · Ambiente: desenvolvimento local (Windows)

---

## 1. Resumo executivo

O Nexum Tower já tem **fundação sólida de produto**: monorepo, landing page, autenticação multi-tenant, RBAC completo no banco, área autenticada com design system interno e telas administrativas de leitura.

Com a entrega **Nexum Core Platform Security & Governance**, o **backend de segurança/governança está completo**: resposta de API padronizada, sessões gerenciáveis, CRUD administrativo (usuários/grupos/papéis/overrides), ABAC (`AuthorizationService`), preparação de RLS, parâmetros por tenant, feature flags, auditoria forte e testes automatizados iniciais. As **telas administrativas de escrita** ficam para a Etapa 2.

**Ainda não existe domínio operacional real** (viagens, ocorrências, custos, mapa, etc.). O Command Center (`/app`) exibe **dados demo estáticos** (agora protegido por `PermissionGate dashboard.read`).

Em uma frase: **plataforma com fundação de segurança pronta para receber os módulos logísticos**.

> Leitura obrigatória para a próxima fase: [SECURITY-GUARDRAILS.md](./SECURITY-GUARDRAILS.md) e [SECURITY-CHECKLIST.md](./SECURITY-CHECKLIST.md).

---

## 2. Mapa do que existe hoje

```txt
┌─────────────────────────────────────────────────────────────────┐
│  PRONTO / FUNCIONAL                                              │
│  Monorepo · Landing · Login · JWT/cookies · RBAC · Seed        │
│  Layout app (sidebar/topbar) · Design system · Admin read-only   │
│  i18n pt/en/es · Auditoria forte (catálogo + filtros)            │
│  API padronizada · Sessões (logout-all/listar/revogar)           │
│  CRUD backend (users/groups/roles/overrides) · ABAC              │
│  Settings + Feature Flags (backend) · RLS preparado · Testes     │
├─────────────────────────────────────────────────────────────────┤
│  PARCIAL / SÓ UI OU MOCK                                         │
│  Command Center (KPIs e viagens fake, com gate dashboard.read)   │
│  Telas admin de escrita (backend pronto, UI = Etapa 2)           │
├─────────────────────────────────────────────────────────────────┤
│  NÃO INICIADO                                                    │
│  Viagens · Cargas · Ocorrências · Mapa · Financeiro · IA         │
│  Telas admin CRUD · Registro self-service · CI/CD · Produção     │
│  RLS FORCE + usuário de baixo privilégio · MFA/SSO · e-mail      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack e estrutura

| Camada | Tecnologia | Status |
|--------|------------|--------|
| Monorepo | pnpm 9 + Turborepo | ✅ |
| Frontend | Next.js 15 + TypeScript + Tailwind | ✅ |
| Backend | NestJS + TypeScript | ✅ |
| Banco | PostgreSQL 18 + Prisma | ✅ |
| Validação | Zod (`packages/shared`) | ✅ parcial |
| i18n | next-intl (pt, en, es) | ✅ |
| UI compartilhada | `packages/ui` (utils) + `apps/web/components/ui/nexum` | ✅ interno |

### Pastas principais

```txt
apps/web/          → Landing, login, área /app
apps/api/          → REST API NestJS
packages/database/ → Schema Prisma, migrations, seed
packages/shared/   → Schemas Zod, helpers RBAC (permissionMatches)
packages/config/   → ESLint, Prettier, TSConfig
docs/              → Documentação técnica
```

### URLs locais

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000/pt |
| API (direta) | http://localhost:3333 |
| Proxy frontend → API | `/api/*` → `localhost:3333` |
| Prisma Studio | `pnpm db:studio` |

---

## 4. Backend (API)

### Módulos implementados

| Módulo | Endpoints | Observação |
|--------|-----------|------------|
| Health | `GET /health` | OK |
| Auth | `POST /auth/login`, `/refresh`, `/logout`, `GET /auth/me` | JWT + cookies httpOnly, rotação de refresh |
| Users | `GET /users` | Listagem por tenant |
| RBAC | `GET /rbac/permissions`, `/roles`, `/groups` | Somente leitura |
| Audit | `GET /audit/logs` | Logs de login/logout (seed + uso) |

### Segurança global

- Guards globais: `ThrottlerGuard`, `JwtAuthGuard`, `PermissionsGuard`
- Rate limit no login
- Refresh token hasheado (SHA-256) em `AuthSession`
- Permissões resolvidas por: papéis diretos → papéis de grupo → overrides ALLOW/DENY

### O que a API **não** tem ainda

- CRUD de usuários, grupos, papéis
- Endpoints de viagens, cargas, ocorrências, custos, clientes, frota
- Registro / convite / reset de senha
- WebSockets ou tempo real
- Upload de arquivos

---

## 5. Banco de dados (Prisma)

### Modelos existentes

| Modelo | Propósito |
|--------|-----------|
| `Tenant` | Multi-empresa |
| `User` | Usuários por tenant |
| `Group`, `GroupMember`, `GroupRole` | Grupos e vínculo com papéis |
| `Role`, `Permission`, `RolePermission` | RBAC |
| `UserRole`, `UserPermissionOverride` | Papéis diretos e exceções |
| `AuthSession` | Sessões refresh |
| `AuditLog` | Trilha de auditoria |

### Seed (`pnpm db:seed`)

- Tenant demo: **Nexum Demo Logistics** (`nexum-demo`)
- 8 papéis de sistema (owner, tenant-admin, operations-manager, etc.)
- 6 grupos + 8 usuários de teste
- ~60 permissões catalogadas (incluindo módulos futuros como `trips.*`, `costs.*`)

**Não há tabelas de negócio** (Trip, Shipment, Incident, Vehicle, etc.).

---

## 6. Frontend — área autenticada (`/app`)

### Layout

| Peça | Arquivo | Comportamento |
|------|---------|---------------|
| Shell | `components/layout/app-shell.tsx` | Sidebar fixa + conteúdo |
| Sidebar | `components/layout/app-sidebar.tsx` | 240px, scroll interno, menu filtrado por permissão |
| Topbar | `components/layout/app-topbar.tsx` | Busca compacta, notificações, idioma, tema |
| Page header | `components/layout/page-header.tsx` | Título, breadcrumb, ações |

### Rotas ativas

| Rota | Conteúdo | Dados |
|------|----------|-------|
| `/app` | Command Center | **Mock** (KPIs + tabela demo) |
| `/app/users` | Usuários | API real (GET) |
| `/app/groups` | Grupos | API real (GET) |
| `/app/roles` | Papéis | API real (GET) |
| `/app/permissions` | Permissões | API real (GET) |
| `/app/audit` | Auditoria | API real (GET) |
| `/app/design-system` | Showcase UI | Estático |

Roteamento consolidado em `app/[locale]/app/[[...section]]/page.tsx` + `AdminSectionRouter`.

### Menu lateral (`lib/navigation.ts`)

Grupos definidos: **Operacional**, **Gestão**, **Inteligência**, **Administração**.

Itens com `comingSoon: true` **não aparecem** no menu (Torre de Controle, Viagens, Cargas, Ocorrências, Mapa, Clientes, Frota, Custos, IA, etc.).

### Design system interno

Componentes em `apps/web/components/ui/nexum/`:

- Botões, cards, badges (status + risco)
- `NexumDataTable` + `NexumPagination` (paginação client-side)
- Formulários, modais, drawers, toasts, skeletons, tabs

Documentação visual: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) · Página live: `/app/design-system`

### Landing e login

- Landing marketing completa (`/[locale]/`)
- Login com painel visual (`/[locale]/login`)
- Redirecionamento pós-login → `/app`
- Página `/access-denied` para RBAC no frontend

---

## 7. Autenticação e RBAC

### Credenciais de teste (local)

| E-mail | Senha | Perfil |
|--------|-------|--------|
| `admin@nexumtower.local` | `admin123` | Owner (acesso total) |
| `tenantadmin@nexumtower.local` | `test123` | Tenant Admin |
| `operacao@nexumtower.local` | `test123` | Operations Manager |
| `operador@nexumtower.local` | `test123` | Logistics Operator |
| `financeiro@nexumtower.local` | `test123` | Finance Analyst |
| `visualizador@nexumtower.local` | `test123` | Viewer |
| `cliente@nexumtower.local` | `test123` | Customer User |
| `motorista@nexumtower.local` | `test123` | Driver |

Detalhes: [AUTHENTICATION.md](./AUTHENTICATION.md) · [RBAC.md](./RBAC.md)

### Comportamento esperado por perfil

| Perfil | Menu visível (resumo) |
|--------|------------------------|
| Owner / Tenant Admin | Command Center + admin completo |
| Operations / Finance / Viewer | Command Center (se tiver `dashboard.read`) |
| Customer / Driver | **Sem** Command Center (`dashboard.read` ausente) — cairão em área limitada ou access denied |
| Logistics Operator | Papel direto, sem grupo — útil para testar escopo mínimo |

Frontend: `PermissionGate` + filtro de menu por permissão.  
Backend: `@RequirePermissions()` nos controllers.

---

## 8. Internacionalização

- Locales: **pt** (default), **en**, **es**
- Mensagens em `apps/web/messages/{pt,en,es}.json`
- Rotas prefixadas: `/pt/app`, `/en/app`, etc.

Doc: [I18N.md](./I18N.md)

---

## 9. Documentação existente

| Documento | Conteúdo |
|-----------|----------|
| [README.md](../README.md) | Setup, scripts, credenciais |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Visão monorepo (parcialmente desatualizada) |
| [ROADMAP.md](./ROADMAP.md) | Fases do produto (**desatualizado** — ver seção 11) |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | Fluxo JWT/cookies |
| [RBAC.md](./RBAC.md) | Modelo de permissões |
| [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | UI da plataforma interna |
| [SETUP-WINDOWS.md](./SETUP-WINDOWS.md) | Ambiente Windows |
| [SECURITY-NOTES.md](./SECURITY-NOTES.md) | Notas de segurança dev |
| **Este arquivo** | Snapshot do estado atual |

---

## 10. Débitos técnicos e limitações conhecidas

| Item | Impacto | Mitigação |
|------|---------|-----------|
| Command Center com dados fake | Não reflete operação real | Substituir ao criar módulo de viagens |
| Admin UI só leitura | Backend CRUD pronto, faltam formulários | Etapa 2 (telas administrativas) |
| Cache `.next` corrompido | Erro `Cannot find module './285.js'` | `pnpm dev:web:clean` + hard refresh |
| Perf dev (~3s navegação) | UX lenta em dev | Turbopack ativo; produção será mais rápida |
| RLS não forçado | Isolamento final ainda depende da aplicação | Ativar FORCE + usuário de baixo privilégio ([RLS.md](./RLS.md)) |
| Sem serviço de e-mail | Convite de usuário sem envio automático | Definir senha via `PATCH` até integrar e-mail |

> Nota: a suposta "duplicação de rotas admin" citada em versões anteriores **não existe** — o roteamento é consolidado no catch-all `[[...section]]` + `AdminSectionRouter`. Testes automatizados iniciais foram adicionados em `apps/api` (Jest).
| Sem CI/CD | Deploy manual | Fase posterior |

---

## 11. Roadmap vs. realidade

O [ROADMAP.md](./ROADMAP.md) ainda marca a Fase 1 como pendente. Estado **real**:

### Fase 0 — Fundação ✅

Monorepo, landing, health check, Prisma Tenant, docs.

### Fase 1 — Auth e multi-tenant ✅ (com ressalvas)

| Item | Status |
|------|--------|
| Login | ✅ |
| JWT / sessões refresh | ✅ |
| RBAC (papéis, grupos, permissões) | ✅ no banco + guards |
| Isolamento por tenant | ✅ nas queries atuais |
| Registro / convite | ❌ |
| CRUD admin | ❌ |

### Fases 2–5 — Não iniciadas

Core operacional, financeiro, IA, escala enterprise.

---

## 12. Sugestões de próximos passos (para você priorizar)

Use como menu de épicos — **não é ordem obrigatória**. Escolha o que destrava mais valor para o seu teste ou MVP.

### Trilha A — Consolidar plataforma (baixo risco)

1. Atualizar `ROADMAP.md` e `ARCHITECTURE.md` para refletir auth/RBAC
2. CRUD admin: convidar/editar/desativar usuários, grupos e papéis
3. Portal mínimo para `cliente` e `motorista` (rotas e layout separados ou menu dedicado)
4. Testes E2E de login + RBAC

### Trilha B — Primeiro módulo operacional (MVP torre de controle)

1. Modelar `Trip` (e relacionamentos) no Prisma + migration
2. API CRUD/listagem/filtros de viagens
3. Substituir mock do Command Center por dados reais
4. Status logísticos + Risk Score (reutilizar badges existentes)
5. Seed com viagens demo

### Trilha C — Ocorrências e SLA

1. Modelo `Incident` + vínculo com viagem
2. Fluxo: criar → atribuir → resolver
3. Indicadores de SLA no dashboard

### Trilha D — Cadastros mestres

Clientes, motoristas, veículos, rotas — necessários antes de escala operacional.

### Trilha E — Produto e escala

CI/CD, ambientes staging/prod, observabilidade, API pública documentada.

---

## 13. Comandos úteis no dia a dia

```bash
pnpm install          # dependências
pnpm db:generate      # client Prisma
pnpm db:migrate       # migrations
pnpm db:seed          # dados demo + usuários teste
pnpm dev              # web + api (você inicia manualmente)
pnpm dev:web:clean    # limpar cache Next.js
pnpm db:studio        # inspecionar banco
pnpm lint             # lint monorepo
pnpm build            # build completo
```

---

## 14. Critérios sugeridos para marcar “próxima fase concluída”

| Marco | Critério objetivo |
|-------|-------------------|
| Admin completo | CRUD usuários/grupos/papéis funcionando com auditoria |
| Torre operacional v1 | Viagens reais no banco + listagem no Command Center |
| RBAC validado | Cada perfil de teste com jornada documentada |
| MVP demo | Fluxo ponta a ponta: cadastro viagem → ocorrência → dashboard |

---

## 15. Contato com o código (referência rápida)

| Área | Onde olhar |
|------|------------|
| Menu e rotas | `apps/web/lib/navigation.ts` |
| Layout app | `apps/web/components/layout/` |
| Páginas admin | `apps/web/components/app/*-admin-page.tsx` |
| Design system | `apps/web/components/ui/nexum/` |
| Auth frontend | `apps/web/providers/auth-provider.tsx`, `lib/auth.ts` |
| Auth API | `apps/api/src/modules/auth/` |
| RBAC API | `apps/api/src/modules/rbac/` |
| Permissões seed | `packages/database/prisma/seed-data/permissions.ts` |
| Schema | `packages/database/prisma/schema.prisma` |

---

*Este documento deve ser atualizado sempre que um épico relevante for entregue (ex.: primeiro CRUD operacional, novo módulo no menu, mudança de arquitetura).*
