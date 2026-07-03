# Autenticação — Nexum Tower

## Visão geral

Autenticação multiempresa (tenant) com:

- Access token JWT (15 min) em cookie `httpOnly` (`nexum_access`)
- Refresh token em cookie `httpOnly` (`nexum_refresh`) com **rotação a cada uso**
- Hash de refresh token no banco (SHA-256)
- Sessões revogáveis no logout
- Rate limit no login (`@nestjs/throttler`)

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | Pública | Login (throttled) |
| POST | `/auth/refresh` | Pública | Renova tokens (rotaciona refresh) |
| POST | `/auth/logout` | JWT | Revoga a sessão atual |
| POST | `/auth/logout-all` | JWT | Revoga **todas** as sessões do usuário |
| GET | `/auth/me` | JWT | Usuário autenticado |
| GET | `/auth/sessions` | JWT | Lista as sessões ativas do próprio usuário |
| DELETE | `/auth/sessions/:sessionId` | JWT | Revoga uma sessão específica |

> As rotas de sessão operam sempre sobre as sessões **do próprio usuário** (não exigem permissão especial). O gerenciamento de sessões de terceiros por um admin usa as permissões `sessions.read`/`sessions.revoke` (trabalho futuro).

## Fluxo de login

1. Frontend envia `POST /auth/login` com `{ email, password }` e `credentials: include`
2. API valida credenciais (mensagem genérica em falha)
3. API cria `AuthSession` com refresh token hasheado
4. API define cookies `nexum_access` e `nexum_refresh` (`httpOnly`, `sameSite=lax`)
5. API retorna apenas `{ user }` — tokens **não** vão no body
6. Frontend atualiza `AuthProvider` com o usuário
7. Redireciona para `/app`

## Fluxo de refresh

1. Ao carregar a app, `AuthProvider` chama `POST /auth/refresh`
2. Cookies enviados automaticamente
3. Novos cookies `nexum_access` e `nexum_refresh` definidos se sessão válida
4. Retorna `{ user }`

## Leitura do JWT na API

A estratégia JWT aceita o token de:

- Cookie `nexum_access`
- Header `Authorization: Bearer <token>`

## Credenciais dev (seed)

Senha padrão dos perfis de teste: **`test123`** (admin usa `admin123`).

| E-mail | Senha | Papel | O que testar |
|--------|-------|-------|----------------|
| `admin@nexumtower.local` | `admin123` | Owner | Acesso total |
| `tenantadmin@nexumtower.local` | `test123` | Tenant Admin | Admin RBAC (sem owner) |
| `operacao@nexumtower.local` | `test123` | Operations Manager | Command Center, sem menu admin |
| `operador@nexumtower.local` | `test123` | Logistics Operator | Operacional básico |
| `financeiro@nexumtower.local` | `test123` | Finance Analyst | Dashboard + leitura financeira |
| `visualizador@nexumtower.local` | `test123` | Viewer | Somente leitura |
| `cliente@nexumtower.local` | `test123` | Customer User | Portal cliente (sem admin) |
| `motorista@nexumtower.local` | `test123` | Driver | App motorista (sem admin) |

Tenant: **Nexum Demo Logistics** (`nexum-demo`)

> Apenas para ambiente local. Nunca use em produção.

Reaplique o seed após atualizar:

```bash
pnpm db:seed
```

## Variáveis de ambiente

Ver `.env.example` na raiz do monorepo. Obrigatório em dev:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `WEB_ORIGIN`

Cookies de auth (opcionais; padrões seguros para dev):

- `AUTH_COOKIE_DOMAIN` — domínio do cookie (vazio em dev)
- `AUTH_COOKIE_SECURE` — `true`/`false` (default: `true` só em produção)
- `AUTH_COOKIE_SAMESITE` — `lax` (default) / `strict` / `none`

> O `maxAge` do cookie de refresh agora é derivado de `REFRESH_TOKEN_EXPIRES_IN` (parser único compartilhado entre service e controller), eliminando a divergência anterior de 7 dias fixos.

## Frontend

- `apps/web/providers/auth-provider.tsx` — estado global (sem token em memória)
- `apps/web/lib/auth.ts` — chamadas de auth
- `apps/web/components/auth/protected-route.tsx` — proteção de rotas
- `apps/web/components/app/app-shell.tsx` — layout do dashboard

Rotas:

- `/login` — login
- `/app` — visão geral do Command Center
- `/app/users` — listagem de usuários
- `/app/roles` — listagem de papéis
- `/app/groups` — listagem de grupos
- `/app/permissions` — catálogo de permissões
- `/app/audit` — logs de auditoria
- `/access-denied` — acesso negado

## Próximos passos

- [ ] MFA / SSO
- [ ] Device/session management UI
- [ ] CRUD completo de usuários, papéis e grupos
