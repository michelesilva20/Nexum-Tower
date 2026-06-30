# Nexum Tower

SaaS de torre de controle logística com IA para monitorar viagens, custos, riscos, ocorrências e SLA em tempo real.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Monorepo | pnpm + Turborepo |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Banco | PostgreSQL |
| ORM | Prisma |
| Validação | Zod |
| Lint/Format | ESLint + Prettier |

## Estrutura de pastas

```txt
nexum-tower/
├── apps/
│   ├── web/          # Frontend Next.js
│   └── api/          # Backend NestJS
├── packages/
│   ├── database/     # Prisma schema, migrations e client
│   ├── config/       # ESLint, Prettier e TSConfig compartilhados
│   ├── ui/           # Componentes compartilhados (futuro)
│   └── shared/       # Tipos, schemas Zod e helpers
├── docs/             # Documentação do projeto
├── .env.example      # Variáveis de ambiente (template)
└── turbo.json        # Configuração Turborepo
```

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 18 (local)

## Instalação

```bash
pnpm install
```

## Configurar variáveis de ambiente

1. Copie o arquivo de exemplo na raiz:

```bash
copy .env.example .env
```

2. Ajuste `DATABASE_URL` com sua senha local do PostgreSQL.

3. Copie também em `packages/database` (usado pelo Prisma):

```bash
copy packages\database\.env.example packages\database\.env
```

## Criar banco local

No Windows, com PostgreSQL instalado em `C:\Program Files\PostgreSQL\18`:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'nexum_tower'" | findstr 1
```

Se o banco não existir:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres nexum_tower
```

## Migrations e seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Rodar em desenvolvimento

```bash
pnpm dev
```

Ou separadamente:

```bash
pnpm dev:web   # Frontend em http://localhost:3000
pnpm dev:api   # Backend em http://localhost:3333
```

## URLs locais

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Frontend (EN) | http://localhost:3000/en |
| Frontend (ES) | http://localhost:3000/es |
| API Health | http://localhost:3333/health |
| Prisma Studio | `pnpm db:studio` → http://localhost:5555 |

## Scripts úteis

```bash
pnpm build      # Build de todos os apps
pnpm lint       # Lint em todo o monorepo
pnpm format     # Formatar com Prettier
pnpm db:studio  # Abrir Prisma Studio
```

## Documentação adicional

- [Arquitetura](./docs/ARCHITECTURE.md)
- [Setup Windows](./docs/SETUP-WINDOWS.md)
- [Internacionalização (i18n)](./docs/I18N.md)
- [Roadmap](./docs/ROADMAP.md)

## Licença

Projeto privado — Nexum Tower.
