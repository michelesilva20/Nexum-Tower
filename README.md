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

## Autenticação (dev)

Após migrations e seed:

```txt
Admin:  admin@nexumtower.local / admin123
Demais perfis de teste: *@nexumtower.local / test123
```

Ver tabela completa em [Autenticação](./docs/AUTHENTICATION.md).

Configure JWT no `.env` (ver `.env.example`).

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Login: http://localhost:3000/pt/login → redireciona para `/app`

O frontend chama a API via proxy same-origin (`/api/*` → `localhost:3333`) para cookies httpOnly funcionarem no navegador.

## Problemas comuns (dev)

**401 no login ou sessão não persiste**
- Reinicie o dev server após mudar `.env` ou `next.config.ts`
- Limpe cookies antigos de `localhost:3333` no navegador (DevTools → Application → Cookies)

**Erro React “development server / production client”**
- Cache `.next` misturado após `pnpm build`. Rode:

```bash
pnpm dev:web:clean
```

- Faça hard refresh no navegador (Ctrl+Shift+R)

Documentação:

- **[Security Guardrails](./docs/SECURITY-GUARDRAILS.md) — leitura obrigatória antes de mexer na API/dados**
- [Security Checklist](./docs/SECURITY-CHECKLIST.md)
- [Autenticação](./docs/AUTHENTICATION.md)
- [Design System (plataforma interna)](./docs/DESIGN-SYSTEM.md)
- [RBAC](./docs/RBAC.md)
- [Notas de segurança](./docs/SECURITY-NOTES.md)

## Documentação adicional

- [Padrões de API](./docs/API-STANDARDS.md)
- [Auditoria](./docs/AUDIT.md)
- [Parâmetros por tenant (Settings)](./docs/SETTINGS.md)
- [Feature Flags](./docs/FEATURE-FLAGS.md)
- [Row Level Security (RLS)](./docs/RLS.md)
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Setup Windows](./docs/SETUP-WINDOWS.md)
- [Internacionalização (i18n)](./docs/I18N.md)
- [Status atual](./docs/STATUS-ATUAL.md)
- [Roadmap](./docs/ROADMAP.md)

## Licença

Projeto privado — Nexum Tower.
