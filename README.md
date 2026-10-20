# Nexum Tower

**A multi-tenant logistics platform in development.** This full-stack monorepo combines a Next.js interface, NestJS API and PostgreSQL persistence, with a focus on authorization, branch-level access and logistics master data.

**Current scope:** platform security, administration, branches, customers, locations, drivers, vehicles and routes. The Command Center uses demonstration data. Shipment/trip execution, incidents, real-time operations and product AI are future work.

## Engineering highlights

| Area | Technologies and evidence |
| --- | --- |
| Web | Next.js 15, React, TypeScript, Tailwind; PT/EN/ES locale structure |
| API | NestJS modules, permission guards, authorization services, request IDs and error handling |
| Data | PostgreSQL, Prisma migrations, tenant-owned data and branch associations |
| Security | JWT, HttpOnly cookies, refresh sessions, RBAC/ABAC, audit records |
| Quality | Jest service tests, Playwright E2E files, GitHub Actions workflow |
| Tooling | pnpm 9.15.4 workspaces, Turborepo, shared types and validation |

Workflow presence does not establish that the latest run passed. No passing badge or production certification is implied.

## Architecture

```text
Browser → Next.js /api proxy → NestJS modules → Prisma → PostgreSQL
                                  ↓
                         authorization + audit
```

The same-origin proxy supports cookie-based authentication. The backend separates platform modules from logistics master data. A tenant-level entity can have operational links to multiple branches; access checks must consider both tenant and branch scope.

### Isolation is a deployment requirement

RLS SQL and a transaction-scoped tenant helper are present. The repository documents a **production readiness gate** around FORCE RLS, the runtime database role and isolation validation. The existence of policies alone does not prove that every runtime query is protected. See [RLS](docs/RLS.md), [logistics status](docs/modules/logistics/README.md) and the [case study](docs/case-study-tenant-boundaries.md).

## Repository map

```text
apps/web/             Next.js interface and API proxy
apps/api/             NestJS platform and logistics modules
packages/database/    Prisma schema, migrations, tenant helpers and RLS SQL
packages/shared/      Shared validation and permission helpers
packages/config/      Shared configuration
packages/ui/          Shared UI package
tests/e2e/            Playwright scenarios
.github/workflows/    CI definition
docs/                 Architecture and module guides
```

## Run locally

Requirements: Node.js 20+, pnpm 9.15.4, and PostgreSQL. Existing local setup documentation specifies PostgreSQL 18; the committed CI workflow uses PostgreSQL 16. Verify both environments before claiming version parity.

1. Run `pnpm install --frozen-lockfile`.
2. Copy the root `.env.example` to `.env` and `packages/database/.env.example` to `packages/database/.env`.
3. Configure a **local development database**, JWT secrets and application URLs as described in the templates. Do not commit environment files or use sample secrets in production.
4. Prepare that local database:

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Migrations and seed change the configured database. Check the connection before running them; use a disposable local database. Seeded demo accounts are for local development only.

Web: `http://localhost:3000/pt` (also `/en`, `/es`). API health: `http://localhost:3333/health`. See [Windows setup](docs/SETUP-WINDOWS.md) and [authentication](docs/AUTHENTICATION.md).

## Quality checks

```sh
pnpm lint
pnpm typecheck
pnpm test:api
pnpm build
pnpm test:e2e
```

E2E requires the configured development services and seeded database. See [Playwright configuration](playwright.config.ts) and [CI](.github/workflows/ci.yml). The portfolio audit inspected configuration and selected test/code paths; it did not execute the complete Nexum suite or validate a live deployment.

## Documentation and limitations

- [Architecture](docs/ARCHITECTURE.md), [API standards](docs/API-STANDARDS.md), [security guardrails](docs/SECURITY-GUARDRAILS.md).
- [Organization](docs/modules/organization/README.md) and [logistics modules](docs/modules/logistics/README.md).
- [RBAC](docs/RBAC.md), [audit](docs/AUDIT.md), [internationalization](docs/I18N.md).
- The older [status snapshot](docs/STATUS-ATUAL.md) contains stale statements: a CI definition and logistics master-data modules now exist in the code. Treat the current source, module guides and workflow as evidence of implementation, not the old snapshot alone.
- No claim of deployed commercial use, completed logistics execution or integrated AI is made.
- This documentation update does not add or change a software license.

## Em português

O Nexum Tower demonstra engenharia full stack com Next.js, NestJS, PostgreSQL, autorização e cadastros logísticos multi-tenant. O painel operacional usa demonstração; viagens, ocorrências e IA permanecem futuros. O isolamento em produção depende de validar RLS e o papel de banco da aplicação.
