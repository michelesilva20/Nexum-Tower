# Nexum Tower — Job Idempotency

## Objetivo

Jobs podem ser executados mais de uma vez por retry, falha de rede ou reprocessamento.

Por isso, jobs críticos precisam ser **idempotentes**.

---

## Definição

Um job é idempotente quando pode ser executado **mais de uma vez** sem causar efeito duplicado ou inconsistente.

---

## Exemplos

**Errado:**

- enviar duas notificações iguais;
- criar dois eventos iguais;
- gerar dois comprovantes iguais;
- duplicar custo;
- duplicar webhook;
- recalcular indicador somando duas vezes.

**Certo:**

- usar `idempotencyKey`;
- verificar se a ação já foi executada;
- usar unique constraints;
- registrar status de processamento;
- usar `entityId + eventType + tenantId` como chave lógica.

---

## Chave de idempotência

Padrão recomendado:

```txt
tenantId + jobType + entityId + eventType
```

Exemplo:

```txt
tenant_123:incident.notification:incident_456:created
```

---

## Estratégias recomendadas

| Estratégia | Quando usar |
|------------|-------------|
| **Unique constraint** | Registros derivados do job (ex.: `ProcessedJob` com `idempotencyKey` UNIQUE) |
| **Check-before-act** | Consultar se efeito já foi aplicado antes de executar |
| **Status machine** | Entidade só aceita transição se status permitir |
| **Outbox dedup** | Mesmo `type + entityId + tenantId` não reenfileira se já `PROCESSED` |

---

## Modelo futuro sugerido (referência)

```prisma
model ProcessedJob {
  id             String   @id @default(cuid())
  tenantId       String
  idempotencyKey String
  jobType        String
  entityId       String?
  processedAt    DateTime @default(now())

  @@unique([tenantId, idempotencyKey])
  @@index([tenantId])
}
```

> Não implementado ainda.

---

## Regra obrigatória

Todo job que gera **efeito externo** ou **persistente** deve ter estratégia de idempotência documentada no módulo que o cria.

---

## Documentos relacionados

- [ASYNC-JOBS.md](./ASYNC-JOBS.md)
- [DLQ.md](./DLQ.md)
- [OUTBOX-PATTERN.md](./OUTBOX-PATTERN.md)
- [JOB-SECURITY.md](./JOB-SECURITY.md)
