# Nexum Tower — Job Security

## Objetivo

Garantir que jobs assíncronos sigam as **mesmas camadas de segurança** do Nexum Core Platform.

---

## Regras obrigatórias

Todo job crítico deve respeitar:

- tenant isolation;
- payload seguro;
- audit log;
- idempotência;
- RLS quando acessar banco (`runWithTenant`);
- feature flags quando aplicável;
- settings quando aplicável;
- permissões quando houver ação manual.

Consultar também: [SECURITY-GUARDRAILS.md](./SECURITY-GUARDRAILS.md), [CURSOR-CORE-PLATFORM-RULES.md](./CURSOR-CORE-PLATFORM-RULES.md).

---

## Tenant isolation

- Todo job deve carregar `tenantId`.
- Toda query executada por job deve filtrar por `tenantId` ou usar `runWithTenant`.
- **Nunca** processar job multi-tenant sem `tenantId`.
- Worker não deve confiar em `tenantId` vindo de payload sem validar contra a entidade de origem.

```typescript
// ✅ CORRETO — worker com contexto de tenant
await runWithTenant(job.tenantId, async (tx) => {
  await tx.incident.findFirst({ where: { id: job.entityId, tenantId: job.tenantId } });
});
```

---

## Payload seguro

Nunca incluir no payload:

- senha;
- `passwordHash`;
- access token;
- refresh token;
- secret de integração;
- credencial de API;
- dados sensíveis desnecessários.

Preferir IDs e buscar dados no processamento com permissões de sistema internas (service account do worker).

---

## Reprocessamento manual

Se houver botão para reprocessar job:

- exigir permissão;
- auditar ação;
- validar tenant (usuário só reprocessa jobs do próprio tenant);
- validar feature flag, se aplicável;
- aplicar idempotência no reprocessamento.

### Permissões futuras sugeridas

```txt
jobs.read
jobs.reprocess
jobs.discard
dlq.read
dlq.reprocess
dlq.discard
```

Adicionar ao seed de permissões quando a infraestrutura for implementada.

---

## Workers e credenciais

- Workers rodam com credenciais de **serviço interno**, não como usuário final.
- Ações que simulam usuário devem registrar `createdBy` / `actorUserId` no audit.
- Integrações externas: credenciais em **TenantSetting** sensível ou vault — nunca no payload do job.

---

## DLQ e dados expostos

Na tela futura de DLQ:

- exibir payload **sanitizado** (sem secrets);
- mascarar PII quando não necessário para diagnóstico;
- restringir acesso por permissão `dlq.read`.

---

## Checklist rápido

- [ ] Job tem `tenantId`?
- [ ] Payload sem secrets?
- [ ] Idempotência definida?
- [ ] Retry + DLQ para job crítico?
- [ ] Audit log nos eventos principais?
- [ ] `runWithTenant` nas queries?
- [ ] Permissões para reprocessamento manual?

---

## Documentos relacionados

- [ASYNC-JOBS.md](./ASYNC-JOBS.md)
- [DLQ.md](./DLQ.md)
- [JOB-IDEMPOTENCY.md](./JOB-IDEMPOTENCY.md)
- [JOB-OBSERVABILITY.md](./JOB-OBSERVABILITY.md)
- [RLS-HARDENING.md](./RLS-HARDENING.md)
