# GO/NO-GO — Nexum Logistics Core

> Verificação final antes de iniciar módulos operacionais (viagens, frota, custos, etc.)

**Data:** julho/2026  
**Decisão:** ✅ **GO**

---

## Objetivo

Verificar se o Nexum Core Platform está pronto para iniciar a camada operacional.

---

## Checklist

- [x] Auth funcionando
- [x] Sessões funcionando
- [x] Logout-all funcionando
- [x] RBAC funcionando
- [x] ABAC funcionando
- [x] Admin UI funcionando
- [x] Settings funcionando
- [x] Feature Flags funcionando
- [x] Audit funcionando
- [x] Menus por permissão funcionando
- [x] API response padrão funcionando
- [x] Global exception filter funcionando
- [x] Tenant isolation testado (ABAC + testes unitários)
- [x] RLS documentado/testado (scripts SQL + teste manual)
- [x] CI passando (lint + typecheck + test + build)
- [x] Testes principais passando (61 unitários + E2E configurado)
- [x] SECURITY-GUARDRAILS atualizado
- [x] CURSOR-CORE-PLATFORM-RULES criado
- [x] SECURITY-CHECKLIST atualizado
- [x] `.cursor/rules/nexum-core-platform.mdc` criado
- [x] Relatório de conformidade criado

---

## Decisão

### ✅ GO — desenvolvimento de Routes/Shipments (próxima fase)

O módulo **Vehicles + VehicleBranch** (Fase 1.4) está **10/10 para desenvolvimento** — ver [FASE-1.4-O-QUE-FOI-FEITO.md](./FASE-1.4-O-QUE-FOI-FEITO.md).

### ✅ GO anterior — Drivers (Fase 1.3)

Documento: [FASE-1.3-O-QUE-FOI-FEITO.md](./FASE-1.3-O-QUE-FOI-FEITO.md)

### ✅ GO anterior — Locations (Fase 1.2)

O módulo **Locations + LocationBranch** (Fase 1.2) está **10/10 para desenvolvimento** — E2E **7/7**.

Documento: [FASE-1.2-O-QUE-FOI-FEITO.md](./FASE-1.2-O-QUE-FOI-FEITO.md)

### ✅ GO anterior — Customers (Fases 1.1 + 1.1.1)

Documentos: [FASE-1.1-O-QUE-FOI-FEITO.md](./FASE-1.1-O-QUE-FOI-FEITO.md) · [FASE-1.1.1-O-QUE-FOI-FEITO.md](./FASE-1.1.1-O-QUE-FOI-FEITO.md)

### ✅ GO anterior — Filiais (Fases 1.0–1.0.2)

Documento: [FASE-1.0.2-FECHAMENTO.md](./FASE-1.0.2-FECHAMENTO.md)

### ⚠️ NO-GO — produção (até validação RLS runtime)

Antes de deploy em produção:

1. Aplicar scripts SQL de hardening (`03`–`04`)
2. Configurar `DATABASE_URL` com `nexum_app`
3. Ativar FORCE RLS
4. Executar `pnpm security:rls:test`

---

## Observações

### Pendências aceitas (não bloqueiam GO)

- **FORCE RLS** não aplicado em dev — scripts em `packages/database/sql/security/04-force-rls-core.sql`
- **nexum_app** não usado em dev — scripts em `01-create-roles.sql` e `02-grant-app-user.sql`
- **MFA/SSO** e **e-mail de convite** — roadmap futuro
- **Command Center** ainda com dados demo — será substituído pelo operacional

### Antes de produção (bloqueante para deploy, não para dev de módulos)

1. Aplicar scripts SQL de hardening (`03-enable-rls-core.sql`, `04-force-rls-core.sql`)
2. Configurar `DATABASE_URL` com `nexum_app`
3. Ativar FORCE RLS
4. Executar `pnpm security:rls:test` (ou `pnpm security:rls:test:docker`)

Ver [modules/organization/RLS.md](./modules/organization/RLS.md)

---

## Próximo passo

Iniciar **Routes/RoutePoints** (Fase 1.5) seguindo [CURSOR-CORE-PLATFORM-RULES.md](./CURSOR-CORE-PLATFORM-RULES.md) e o molde de Vehicles:

1. Modelar entidade global + vínculo por filial quando aplicável
2. Criar policies RLS para novas tabelas
3. Implementar APIs com guards + ABAC (leitura por filial · mutação global separada) + audit
4. Adicionar permissões ao seed
5. Criar telas com PermissionGate alinhado à API

---

## Async / DLQ

Ao modelar módulos operacionais, avaliar por feature:

- [ ] O módulo gera eventos assíncronos?
- [ ] O módulo precisa de Outbox?
- [ ] O módulo precisa de DLQ?
- [ ] O módulo precisa de job idempotente?
- [ ] O módulo precisa de auditoria de job?
- [ ] O módulo precisa de reprocessamento?

> A infraestrutura ativa de DLQ **não é obrigatória** para iniciar cadastros mestres (clientes, motoristas, veículos).
>
> Ela se torna **obrigatória** quando o Logistics Core iniciar fluxos assíncronos críticos: notificações, tracking, geofence, Risk Score, webhooks, relatórios ou IA.

Documentos: [ASYNC-JOBS.md](./ASYNC-JOBS.md), [DLQ.md](./DLQ.md), [OUTBOX-PATTERN.md](./OUTBOX-PATTERN.md)
