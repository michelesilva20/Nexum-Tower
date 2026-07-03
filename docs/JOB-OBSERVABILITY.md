# Nexum Tower — Job Observability

## Objetivo

Jobs assíncronos precisam ser **rastreáveis** — do enqueue ao reprocessamento ou descarte.

---

## Campos mínimos de rastreabilidade

Todo job crítico deve ter:

- `jobId`;
- `queueName`;
- `tenantId`;
- `type`;
- `entity`;
- `entityId`;
- `requestId`;
- `correlationId`;
- `attempts`;
- `status`;
- `startedAt`;
- `finishedAt`;
- `failedAt`;
- error message **segura** (sem stack trace em produção para usuários).

---

## Status recomendados

```txt
QUEUED
PROCESSING
COMPLETED
FAILED
RETRYING
DEAD_LETTER
REPROCESSED
DISCARDED
```

Alinhado com `OutboxEventStatus` em [OUTBOX-PATTERN.md](./OUTBOX-PATTERN.md).

---

## Logs

Logs de job devem incluir:

- `jobId`;
- `tenantId`;
- `queueName`;
- `type`;
- `entityId`;
- `requestId`;
- `duration`;
- `status`.

**Nunca** logar secrets, tokens ou senha.

Exemplo de log estruturado (futuro):

```json
{
  "level": "info",
  "message": "Job completed",
  "jobId": "job_abc",
  "tenantId": "tenant_xyz",
  "queueName": "notifications",
  "type": "email.invite",
  "entityId": "user_123",
  "requestId": "req_456",
  "durationMs": 842,
  "status": "COMPLETED"
}
```

---

## Correlação com a API

- `requestId` — propagado do `RequestIdMiddleware` da API quando o job foi enfileirado na mesma requisição;
- `correlationId` — agrupa jobs relacionados (ex.: todos os efeitos de uma ocorrência);
- `jobId` — identificador único do job na fila.

Permite rastrear: **requisição HTTP → outbox → fila → worker → audit log**.

---

## Métricas futuras

Métricas recomendadas (Prometheus/Datadog ou similar):

- jobs por fila;
- falhas por fila;
- tempo médio de processamento;
- quantidade em DLQ;
- retries por tipo;
- jobs críticos pendentes;
- reprocessamentos.

---

## Auditoria

Eventos de job devem aparecer no `AuditLog` quando críticos (ver catálogo em [DLQ.md](./DLQ.md)).

---

## Tela futura

`/app/admin/jobs` e `/app/admin/dlq` — listagem, filtros, detalhes de erro, reprocessamento (ver [DLQ.md](./DLQ.md)).

---

## Documentos relacionados

- [ASYNC-JOBS.md](./ASYNC-JOBS.md)
- [DLQ.md](./DLQ.md)
- [JOB-SECURITY.md](./JOB-SECURITY.md)
- [AUDIT.md](./AUDIT.md)
