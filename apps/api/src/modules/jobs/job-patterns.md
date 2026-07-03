# Future Job Patterns

> Referência arquitetural — **não importar em código de produção ainda**.

## Padrão futuro de job

```typescript
type NexumJobPayload<TPayload = Record<string, unknown>> = {
  jobId: string;
  tenantId: string;
  type: string;
  entity?: string;
  entityId?: string;
  requestId?: string;
  correlationId?: string;
  createdBy?: string;
  payload: TPayload;
  metadata?: Record<string, unknown>;
};
```

## Padrão futuro de enqueue (Outbox + fila)

```typescript
// Pseudocódigo — implementação futura
async function enqueueFromOutbox(outboxEvent: OutboxEvent) {
  await queue.add(
    outboxEvent.type,
    buildJobPayload(outboxEvent),
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false, // mover para DLQ via handler
    },
  );
}
```

## Regras

- Sempre incluir `tenantId`.
- Nunca incluir secrets no payload.
- Sempre pensar em idempotência ([JOB-IDEMPOTENCY.md](../../../../docs/JOB-IDEMPOTENCY.md)).
- Sempre avaliar DLQ ([DLQ.md](../../../../docs/DLQ.md)).
- Sempre avaliar audit log ([DLQ.md](../../../../docs/DLQ.md#auditoria)).
- Queries no worker: `runWithTenant(tenantId, tx => ...)` ([RLS-HARDENING.md](../../../../docs/RLS-HARDENING.md)).

## Filas futuras sugeridas

Ver estrutura em [DLQ.md](../../../../docs/DLQ.md#estrutura-futura-de-filas).

## Status de job

Ver [JOB-OBSERVABILITY.md](../../../../docs/JOB-OBSERVABILITY.md#status-recomendados).
