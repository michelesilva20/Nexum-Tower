# Logistics Core — Módulo Clientes

Primeiro cadastro mestre logístico do Nexum Tower (Fase 1.1).

## Decisão arquitetural

```txt
Customer = entidade global do tenant
CustomerBranch = vínculo operacional cliente ↔ filial
```

Não existe `Customer.branchId` obrigatório simples.

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [CUSTOMERS.md](./CUSTOMERS.md) | Model Customer, regras, campos |
| [CUSTOMER-BRANCH.md](./CUSTOMER-BRANCH.md) | Vínculo operacional, isPrimary |
| [PERMISSIONS.md](./PERMISSIONS.md) | RBAC customers.* / logistics.* |
| [RLS.md](./RLS.md) | Policies tenant isolation |
| [API.md](./API.md) | Endpoints REST |

## Status

- CRUD API: `/logistics/customers`
- Tela: `/app/logistics/customers`
- ABAC hardened (Fase 1.1.1): leitura por filial · mutação global separada
- RLS: scripts preparados (`07-customers-hardening.sql`)
- **10/10 dev** após E2E validado
- Produção: NO-GO até FORCE RLS + `security:rls:test` com `nexum_app` com `nexum_app`

## Próximos módulos

Locations → Drivers → Vehicles → Routes → RoutePoints
