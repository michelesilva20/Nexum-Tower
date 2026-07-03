# Nexum Tower — Dead Letter Queue

## O que é DLQ

DLQ significa **Dead Letter Queue**.

É uma fila onde jobs/eventos são enviados depois de falharem mesmo após todas as tentativas de retry configuradas.

A DLQ existe para impedir perda silenciosa de eventos críticos e permitir investigação, correção e reprocessamento.

---

## Por que o Nexum Tower precisa de DLQ

O Nexum Tower terá processos críticos na operação logística:

- eventos de viagem;
- notificações;
- webhooks;
- Risk Score;
- geofence;
- documentos;
- relatórios;
- IA;
- integrações.

Esses processos **não podem falhar silenciosamente**.

---

## Regra principal

Toda fila crítica deve ter:

- tentativas de retry;
- backoff;
- DLQ;
- audit log;
- payload seguro;
- correlação por `requestId` / `jobId`;
- `tenantId`;
- forma de reprocessamento;
- forma de investigação.

---

## Quando uma DLQ é obrigatória

DLQ é obrigatória quando o job:

- chama serviço externo;
- processa evento crítico;
- afeta SLA;
- afeta status operacional;
- envia notificação importante;
- integra com cliente;
- gera documento;
- processa IA;
- executa em lote;
- pode ser reprocessado.

---

## Quando DLQ pode não ser necessária

DLQ pode ser dispensada quando:

- o job não é crítico;
- a falha não causa impacto operacional;
- o job pode simplesmente ser descartado;
- o processamento é puramente temporário;
- existe outra fonte confiável de reprocessamento.

Mesmo nesses casos, **justificar no documento do módulo**.

---

## Padrão de retry recomendado

| Tipo de job | Tentativas | Backoff | DLQ |
|---|---:|---|---|
| E-mail | 3 | exponencial | sim |
| WhatsApp/notificação | 5 | exponencial | sim |
| Webhook externo | 5 | exponencial | sim |
| Risk Score | 3 | exponencial | sim |
| Relatório | 2 | exponencial | sim |
| Geofence/tracking | 5 | exponencial | sim |
| IA operacional | 3 | exponencial | sim |
| Integração ERP/TMS/WMS | 5 | exponencial | sim |

---

## Estrutura futura de filas

Exemplo futuro:

```txt
queues/
  notifications.queue
  notifications.dlq

  webhooks.queue
  webhooks.dlq

  trip-events.queue
  trip-events.dlq

  risk-score.queue
  risk-score.dlq

  documents.queue
  documents.dlq

  ai.queue
  ai.dlq
```

---

## Payload mínimo de um job

Todo job crítico deve carregar:

```json
{
  "jobId": "string",
  "tenantId": "string",
  "type": "string",
  "entity": "string",
  "entityId": "string",
  "correlationId": "string",
  "requestId": "string",
  "createdBy": "string",
  "payload": {},
  "metadata": {}
}
```

Ver também [JOB-SECURITY.md](./JOB-SECURITY.md) e `apps/api/src/modules/jobs/job-patterns.md`.

---

## Segurança do payload

Nunca incluir no payload:

- senha;
- access token;
- refresh token;
- secrets;
- dados sensíveis desnecessários;
- arquivos brutos grandes;
- credenciais de integração.

Preferir IDs e buscar os dados necessários no processamento.

---

## Auditoria

Eventos mínimos de auditoria para jobs críticos:

- `JOB_ENQUEUED`
- `JOB_PROCESSING`
- `JOB_COMPLETED`
- `JOB_FAILED`
- `JOB_RETRYING`
- `JOB_MOVED_TO_DLQ`
- `JOB_REPROCESSED`
- `JOB_DISCARDED`

> Adicionar ao catálogo `audit-actions.ts` quando a infraestrutura for implementada.

---

## Reprocessamento

Toda DLQ crítica deve permitir reprocessamento futuro.

O reprocessamento deve:

- validar `tenantId`;
- validar permissão do usuário que solicitou reprocessamento;
- registrar `AuditLog`;
- preservar histórico da falha original;
- evitar duplicidade por idempotência.

Permissões futuras sugeridas: `jobs.reprocess`, `dlq.reprocess` (ver [JOB-SECURITY.md](./JOB-SECURITY.md)).

---

## Tela futura

Criar futuramente:

```txt
/app/admin/jobs
/app/admin/dlq
```

Funcionalidades futuras:

- listar jobs falhados;
- filtrar por fila;
- filtrar por tenant;
- ver erro;
- ver payload seguro;
- reprocessar;
- descartar;
- registrar auditoria.

---

## Decisão atual

Nesta fase, a DLQ está **apenas documentada e preparada**.

A infraestrutura ativa com Redis/BullMQ será implementada quando surgir o **primeiro fluxo assíncrono real** (ex.: envio de e-mail de convite ou webhook operacional).

---

## Documentos relacionados

- [ASYNC-JOBS.md](./ASYNC-JOBS.md)
- [OUTBOX-PATTERN.md](./OUTBOX-PATTERN.md)
- [JOB-IDEMPOTENCY.md](./JOB-IDEMPOTENCY.md)
- [JOB-OBSERVABILITY.md](./JOB-OBSERVABILITY.md)
- [JOB-SECURITY.md](./JOB-SECURITY.md)
