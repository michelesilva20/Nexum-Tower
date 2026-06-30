# Arquitetura — Nexum Tower

## Visão geral

O Nexum Tower é um monorepo organizado em **apps** (aplicações executáveis) e **packages** (código compartilhado).

```txt
┌─────────────────────────────────────────────────────────┐
│                      apps/web (Next.js)                  │
│              Landing page / futuro dashboard             │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────┐
│                     apps/api (NestJS)                    │
│              REST API / futuros módulos de negócio       │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma Client
┌──────────────────────────▼──────────────────────────────┐
│                  packages/database                       │
│           Schema Prisma / migrations / seed              │
└──────────────────────────┬──────────────────────────────┘
                           │
                    PostgreSQL
```

## Pacotes compartilhados

| Pacote | Responsabilidade |
|--------|------------------|
| `@nexum-tower/config` | ESLint, Prettier e TSConfig base |
| `@nexum-tower/shared` | Schemas Zod, tipos e helpers |
| `@nexum-tower/ui` | Componentes React reutilizáveis |
| `database` | Prisma schema, client e migrations |

## Convenções

- **Multi-tenant**: modelo `Tenant` como base para isolamento futuro por empresa.
- **Validação**: Zod no pacote `shared` para contratos entre frontend e backend.
- **Portas**: Web `3000`, API `3333`, PostgreSQL `5432`.
- **Variáveis de ambiente**: `.env` na raiz + `packages/database/.env` para Prisma.

## Próximas camadas (planejado)

1. Autenticação e autorização (RBAC)
2. Módulos de viagens, ocorrências e SLA
3. Dashboard operacional em tempo real
4. Integrações e camada de IA operacional
