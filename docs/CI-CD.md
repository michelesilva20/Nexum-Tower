# CI/CD — Nexum Tower

---

## GitHub Actions — CI Pipeline

Arquivo: `.github/workflows/ci.yml`

### Jobs

| Job | Trigger | O que faz |
|-----|---------|-----------|
| `validate` | push/PR em main/develop | lint + typecheck + test + build (com PostgreSQL) |
| `e2e` | push em main | Playwright (após validate) |

### `validate`

```
PostgreSQL 16 service container
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm lint
pnpm typecheck
pnpm test:api        # 61 testes unitários
build shared → api → web
```

### `e2e`

```
PostgreSQL + migrate + seed
pnpm exec playwright install chromium --with-deps
pnpm test:e2e        # sobe pnpm dev via webServer
```

---

## Executar CI localmente

```bash
pnpm install
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm lint
pnpm typecheck
pnpm test:api
pnpm build
pnpm test:e2e        # opcional
```

---

## Variáveis de ambiente no CI

| Variável | Valor no CI |
|----------|-------------|
| `DATABASE_URL` | `postgresql://postgres:admin@localhost:5432/nexum_tower_test` |
| `JWT_ACCESS_SECRET` | placeholder (32+ chars) |
| `JWT_REFRESH_SECRET` | placeholder (32+ chars) |
| `WEB_ORIGIN` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3333` |

---

## Scripts úteis (package.json raiz)

| Script | Descrição |
|--------|-----------|
| `pnpm typecheck` | tsc --noEmit (api + web) |
| `pnpm test:api` | 61 testes Jest |
| `pnpm test:e2e` | Playwright |
| `pnpm db:migrate:deploy` | Migrations non-interactive (CI/prod) |
| `pnpm security:rls:test` | Teste manual RLS |

---

## Deploy (planejado)

```text
main branch → staging auto-deploy
tag v*.*.* → production deploy (manual aprovação)
```

Antes de produção: aplicar scripts RLS + `DATABASE_URL` com `nexum_app`.
