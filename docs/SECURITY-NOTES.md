# Notas de segurança — Nexum Tower

## Senhas

- Hash com **bcrypt** (cost 12) no seed e login
- **Argon2** é preferível em produção; bcrypt foi escolhido nesta etapa por compatibilidade ampla no Windows/dev sem dependências nativas extras
- `passwordHash` nunca é retornado pela API

## Tokens

- Access token JWT assinado com `JWT_ACCESS_SECRET` — cookie `nexum_access` (`httpOnly`)
- Refresh token aleatório (48 bytes hex) — **apenas hash SHA-256** persistido
- Refresh em cookie `nexum_refresh` (`httpOnly`) — **rotacionado a cada refresh**
- Tokens **não** são expostos no body da resposta de login/refresh
- Não usar `localStorage` para tokens

## Login

- Mensagem genérica: `Credenciais inválidas.` — não revela se e-mail existe
- Rate limit via `@nestjs/throttler` no endpoint de login
- Auditoria: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `TOKEN_REFRESH`, `PERMISSION_DENIED`

## CORS

- `credentials: true` habilitado
- Origem controlada por `WEB_ORIGIN` / `API_CORS_ORIGIN`

## Multi-tenant

- JWT inclui `tenantId`
- Sessões vinculadas a `tenantId`
- Queries devem sempre filtrar por tenant do usuário autenticado

## RBAC

- Guard global `PermissionsGuard` com modo ALL (padrão) ou ANY via `@RequireAnyPermissions`
- Permissões no formato `resource.action` com wildcards (`trips.*`, `*`)

## Dev only

```txt
Dev users (local only):

- `admin@nexumtower.local` / `admin123` (Owner)
- Demais perfis: `*@nexumtower.local` / `test123` — ver `docs/AUTHENTICATION.md`
```

Rotacionar secrets JWT antes de qualquer deploy.

## Pendências recomendadas

- [ ] Lockout progressivo após tentativas falhas (além do throttling)
- [ ] CSRF protection se cookies cross-site
- [ ] Helmet / security headers
- [ ] Secrets manager em produção
- [ ] MFA e SSO corporativo
- [ ] CRUD backend com validação e auditoria para RBAC
