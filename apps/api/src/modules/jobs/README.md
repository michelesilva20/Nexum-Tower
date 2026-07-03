# Jobs Module — Future Infrastructure

Este módulo **ainda não possui implementação ativa**.

Ele existe apenas para documentar os padrões futuros de filas, DLQ, Outbox, idempotência e observabilidade.

## Não fazer ainda

- Não adicionar Redis/BullMQ aqui até existir o primeiro fluxo assíncrono real.
- Não criar workers, processors ou módulos NestJS ativos.
- Não alterar `app.module.ts` para registrar filas.

## Documentos oficiais

- [docs/ASYNC-JOBS.md](../../../../docs/ASYNC-JOBS.md)
- [docs/DLQ.md](../../../../docs/DLQ.md)
- [docs/OUTBOX-PATTERN.md](../../../../docs/OUTBOX-PATTERN.md)
- [docs/JOB-IDEMPOTENCY.md](../../../../docs/JOB-IDEMPOTENCY.md)
- [docs/JOB-OBSERVABILITY.md](../../../../docs/JOB-OBSERVABILITY.md)
- [docs/JOB-SECURITY.md](../../../../docs/JOB-SECURITY.md)

## Gatilhos para implementação

Implementar infraestrutura ativa quando surgir o **primeiro** caso real, por exemplo:

- envio de e-mail de convite;
- webhook operacional;
- notificação de ocorrência;
- processamento assíncrono de Risk Score.

Ver também [job-patterns.md](./job-patterns.md) nesta pasta.
