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

### ✅ GO

O Nexum Core Platform está pronto para receber o **Nexum Logistics Core**.

---

## Observações

### Pendências aceitas (não bloqueiam GO)

- **FORCE RLS** não aplicado em dev — scripts em `packages/database/sql/security/04-force-rls-core.sql`
- **nexum_app** não usado em dev — scripts em `01-create-roles.sql` e `02-grant-app-user.sql`
- **MFA/SSO** e **e-mail de convite** — roadmap futuro
- **Command Center** ainda com dados demo — será substituído pelo operacional

### Antes de produção (bloqueante para deploy, não para dev de módulos)

1. Aplicar scripts SQL de hardening
2. Configurar `DATABASE_URL` com `nexum_app`
3. Ativar FORCE RLS
4. Executar `pnpm security:rls:test`

---

## Próximo passo

Iniciar **Nexum Logistics Core** seguindo [CURSOR-CORE-PLATFORM-RULES.md](./CURSOR-CORE-PLATFORM-RULES.md):

1. Modelar entidades operacionais no Prisma (com `tenantId`)
2. Criar policies RLS para novas tabelas
3. Implementar APIs com guards + ABAC + audit
4. Adicionar permissões ao seed
5. Criar telas com PermissionGate

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
