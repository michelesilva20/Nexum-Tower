# Organization Module — Nexum Tower

Fase **1.0** do Nexum Logistics Core: estrutura organizacional por **filiais** dentro do tenant.

> **Entrega completa:** [FASE-1.0-FILIAIS.md](../../FASE-1.0-FILIAIS.md)  
> **Hardening 10/10:** [FASE-1.0.1-HARDENING.md](../../FASE-1.0.1-HARDENING.md)

## Conceito

```txt
Tenant  = empresa contratante do SaaS (isolamento forte)
Branch  = unidade operacional dentro do tenant (escopo operacional)
```

Não transformar filial em tenant. Ver [BRANCHES.md](./BRANCHES.md).

## Documentos

| Arquivo | Conteúdo |
|---------|----------|
| [BRANCHES.md](./BRANCHES.md) | Modelo, API, regras de negócio |
| [USER-BRANCH-ACCESS.md](./USER-BRANCH-ACCESS.md) | Vínculo usuário ↔ filial |
| [PERMISSIONS.md](./PERMISSIONS.md) | Permissões RBAC |
| [RLS.md](./RLS.md) | Policies PostgreSQL preparadas |
| [MIGRATIONS.md](./MIGRATIONS.md) | Baseline, reprodutibilidade, procedimentos |

## Próximo passo

**Fase 1.1 — Customers** com suporte a `branchId`.

Todos os cadastros operacionais futuros devem considerar `tenantId` + `branchId`.
