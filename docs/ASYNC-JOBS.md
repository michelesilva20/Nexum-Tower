# Nexum Tower — Async Jobs

## Objetivo

Este documento define o padrão para tarefas assíncronas futuras do Nexum Tower.

Tarefas assíncronas devem ser usadas quando uma operação:

- depende de serviço externo;
- pode demorar;
- pode falhar temporariamente;
- precisa de retry;
- não deve bloquear a resposta da API;
- precisa ser processada em segundo plano;
- precisa ser reprocessável.

---

## Exemplos futuros

- envio de e-mail de convite;
- notificações operacionais;
- webhooks para clientes;
- processamento de eventos de viagem;
- cálculo de Risk Score;
- processamento de geofence;
- geração de relatórios;
- validação de documentos;
- IA operacional;
- integrações ERP/TMS/WMS.

---

## Stack futura recomendada

A stack recomendada para jobs assíncronos é:

- **Redis** — broker de filas;
- **BullMQ** — filas, retry, backoff, DLQ;
- **NestJS workers** — processamento em background;
- **PostgreSQL Outbox** — garantia de entrega (ver [OUTBOX-PATTERN.md](./OUTBOX-PATTERN.md));
- **AuditLog** — rastreabilidade de jobs críticos;
- **DLQ** — Dead Letter Queue (ver [DLQ.md](./DLQ.md));
- **Dashboard/admin de jobs** — futuramente em `/app/admin/jobs` e `/app/admin/dlq`.

> **Status atual:** apenas documentado. Redis/BullMQ **não estão instalados**.

---

## Princípios obrigatórios

Toda tarefa assíncrona crítica deve avaliar:

- retry;
- backoff;
- DLQ;
- idempotência ([JOB-IDEMPOTENCY.md](./JOB-IDEMPOTENCY.md));
- auditoria;
- payload seguro ([JOB-SECURITY.md](./JOB-SECURITY.md));
- observabilidade ([JOB-OBSERVABILITY.md](./JOB-OBSERVABILITY.md));
- reprocessamento;
- tenant isolation;
- permissões quando houver ação manual;
- feature flag quando for funcionalidade opcional.

---

## Quando NÃO usar job

Não usar job para operações simples e rápidas que precisam retornar resultado imediato.

Exemplos:

- consulta simples;
- CRUD simples;
- validação de formulário;
- edição direta de configuração;
- leitura de tabela.

---

## Quando usar job

Usar job quando houver risco de lentidão, falha externa ou necessidade de retry.

Exemplos:

- enviar e-mail;
- chamar API externa;
- processar documento;
- recalcular indicador pesado;
- enviar webhook;
- gerar PDF;
- processar lote.

---

## Documentos relacionados

| Documento | Tema |
|-----------|------|
| [DLQ.md](./DLQ.md) | Dead Letter Queue |
| [OUTBOX-PATTERN.md](./OUTBOX-PATTERN.md) | Outbox Pattern |
| [JOB-IDEMPOTENCY.md](./JOB-IDEMPOTENCY.md) | Idempotência |
| [JOB-OBSERVABILITY.md](./JOB-OBSERVABILITY.md) | Observabilidade |
| [JOB-SECURITY.md](./JOB-SECURITY.md) | Segurança de jobs |
| [CURSOR-CORE-PLATFORM-RULES.md](./CURSOR-CORE-PLATFORM-RULES.md) | Regras permanentes |

---

## Pasta preparatória no código

`apps/api/src/modules/jobs/` — documentação arquitetural apenas (sem implementação ativa).
