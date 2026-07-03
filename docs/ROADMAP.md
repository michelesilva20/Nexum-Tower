# Roadmap — Nexum Tower

Roadmap do produto. Fases futuras serão refinadas conforme evolução do projeto.

## Fase 0 — Fundação

- [x] Monorepo pnpm + Turborepo
- [x] Frontend Next.js com landing page
- [x] Backend NestJS com health check
- [x] PostgreSQL + Prisma (modelo Tenant)
- [x] Documentação inicial

## Fase 1 — Autenticação e multi-tenant

- [x] Login (registro self-service ainda pendente)
- [x] JWT / sessões (rotação de refresh, logout-all, listar/revogar sessões)
- [x] RBAC completo (papéis, grupos, overrides, DENY > ALLOW)
- [x] Isolamento por tenant (`currentUser.tenantId` + RLS preparado)

## Fase 1.5 — Nexum Core Platform Security & Governance ✅ CONCLUÍDO

- [x] API padronizada (envelope, erros, request-id, Helmet)
- [x] CRUD administrativo backend (usuários, grupos, papéis, permissões, overrides)
- [x] ABAC / object-level (`AuthorizationService`)
- [x] Parâmetros por tenant (Settings) e Feature Flags
- [x] Auditoria forte (catálogo + filtros + paginação)
- [x] RLS preparado (policies sem FORCE) + `runWithTenant`
- [x] 24 testes de segurança iniciais (Jest)

## Fase 1.6 — Admin UI + Security Console + RLS Hardening + CI ✅ CONCLUÍDO

- [x] Admin UI completo: Usuários (CRUD + overrides), Grupos, Roles, Permissões, Auditoria
- [x] Settings Hub + Parâmetros editáveis + Feature Flags toggleáveis
- [x] Sessions page (listar, revogar, logout-all)
- [x] Security Console (`/app/settings/security`)
- [x] PermissionGate + AnyPermissionGate + FeatureGate + RoleGate
- [x] Sidebar com menus filtrados por permissão (requiredPermission)
- [x] NexumButton com suporte a `size` prop
- [x] 50 testes unitários passando
- [x] GitHub Actions CI (lint + typecheck + test + build)
- [x] docs/RLS-HARDENING.md + ADMIN-UI.md + TESTING.md + CI-CD.md
- [ ] RLS completo (FORCE + usuário nexum_app)
- [ ] MFA / SSO · convite por e-mail
- [ ] Playwright E2E básico

## Fase 1.7 — Finalização 10/10 Core Platform ✅ CONCLUÍDO

- [x] Scripts SQL RLS (`packages/database/sql/security/`)
- [x] Usuários PostgreSQL `nexum_app` / `nexum_migrator` documentados
- [x] Teste manual RLS (`05-test-rls-isolation.sql`)
- [x] 61 testes unitários API
- [x] Playwright E2E (8 fluxos)
- [x] CI consolidado (postgres + migrate + seed + validate)
- [x] `docs/CURSOR-CORE-PLATFORM-RULES.md`
- [x] `.cursor/rules/nexum-core-platform.mdc`
- [x] Relatório de conformidade + GO/NO-GO
- [ ] FORCE RLS em produção (script pronto, aplicar no deploy)
- [ ] MFA / SSO · convite por e-mail

## Async Jobs & DLQ Infrastructure

**Status:** Preparado / Documentado (sem infra ativa)

Escopo futuro:

- Redis
- BullMQ
- QueueModule
- WorkerModule
- OutboxEvent
- JobAudit
- DLQ
- tela `/app/admin/jobs`
- tela `/app/admin/dlq`
- reprocessamento manual
- métricas de filas

Documentação: `docs/ASYNC-JOBS.md`, `docs/DLQ.md`, `docs/OUTBOX-PATTERN.md`

Gatilhos de implementação:

- envio real de e-mail;
- notificações operacionais;
- eventos de viagem;
- Risk Score assíncrono;
- webhooks;
- integração externa;
- IA operacional;
- relatórios em background.

## Fase 2 — Core operacional (Nexum Logistics Core)

- [ ] Cadastro de viagens
- [ ] Ocorrências e eventos
- [ ] Indicadores de SLA
- [ ] Dashboard operacional

## Fase 3 — Financeiro e riscos

- [ ] Custos por viagem
- [ ] Margem e desvios
- [ ] Matriz de riscos
- [ ] Alertas configuráveis

## Fase 4 — Inteligência operacional

- [ ] Insights com IA
- [ ] Recomendações automáticas
- [ ] Previsão de atrasos e desvios
- [ ] Integrações externas (TMS, ERP, telemetria)

## Fase 5 — Escala e enterprise

- [ ] Auditoria e logs
- [ ] Relatórios avançados
- [ ] API pública documentada
- [ ] Deploy em produção (CI/CD)
