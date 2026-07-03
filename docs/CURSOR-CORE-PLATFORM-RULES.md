# Nexum Tower — Cursor Core Platform Rules

## 1. Objetivo

Este documento define as regras obrigatórias que o Cursor deve seguir ao criar, alterar ou revisar qualquer parte do Nexum Tower.

O Nexum Tower é um SaaS B2B multi-tenant. Portanto, toda implementação deve respeitar as camadas de segurança, governança, autorização, auditoria e isolamento de dados da plataforma.

Nenhum módulo novo deve ser criado sem consultar este documento.

---

## 2. Regra principal

Antes de implementar qualquer coisa, o Cursor deve verificar:

- O módulo precisa de tenantId?
- O módulo precisa de permissões?
- O módulo precisa de RLS?
- O módulo precisa de auditoria?
- O módulo precisa de settings?
- O módulo precisa de feature flag?
- O módulo precisa de filtros e paginação?
- O módulo precisa de PermissionGate no frontend?
- O módulo precisa validar object-level authorization?
- O módulo precisa de testes?
- O módulo dispara processamento assíncrono crítico (fila, retry, DLQ)?

Se a resposta for sim para qualquer item, a camada correspondente deve ser implementada no mesmo ciclo da feature.

---

## 3. Camadas obrigatórias do Nexum Core Platform

Toda funcionalidade deve respeitar:

1. Authentication
2. Session security
3. Tenant isolation
4. RBAC
5. ABAC
6. Object-level authorization
7. RLS
8. DTO validation
9. API response standard
10. Error handling standard
11. Audit logging
12. Settings, quando aplicável
13. Feature flags, quando aplicável
14. Frontend permission gates
15. Tests
16. Documentation

---

## 4. Tenant isolation

Nunca aceitar tenantId vindo do frontend para operações sensíveis.

Errado:

```ts
const tenantId = dto.tenantId;
```

Certo:

```ts
const tenantId = currentUser.tenantId;
```

Toda query multi-tenant deve filtrar por tenantId.

Todo objeto acessado por ID deve validar ownership pelo tenant.

Exemplo:

```ts
await prisma.trip.findFirst({
  where: {
    id: tripId,
    tenantId: currentUser.tenantId,
  },
});
```

Se o objeto não pertence ao tenant do usuário, retornar 404 ou 403 conforme o padrão do módulo.

---

## 5. RBAC

Permissões devem seguir o padrão:

```txt
resource.action
```

Exemplos:

```txt
users.read
users.create
roles.manage_permissions
settings.update
audit.read
trips.read
trips.create
incidents.resolve
costs.approve
```

Toda rota protegida deve usar:

```ts
@RequirePermissions('resource.action')
```

ou permissão equivalente.

Não criar rota administrativa sem permissão.

Não confiar apenas no frontend para esconder ações.

---

## 6. ABAC e Object-level Authorization

RBAC responde se o usuário pode fazer uma ação.

ABAC responde se o usuário pode fazer essa ação naquele contexto.

Sempre validar:

- O objeto pertence ao tenant?
- O usuário pode acessar este objeto específico?
- O objeto está em um status que permite alteração?
- O usuário pode alterar este tipo de entidade?
- Existe regra especial para role de sistema, owner, setting sensível ou feature crítica?

Exemplos obrigatórios:

- Não permitir alterar dados de outro tenant.
- Não permitir deletar role de sistema sem regra explícita.
- Não permitir remover o último Owner do tenant.
- Não permitir que usuário sem permissão forte altere security settings.

---

## 7. RLS

Toda tabela multi-tenant deve ser candidata a Row-Level Security.

Nova tabela multi-tenant deve ter:

- tenantId
- índice por tenantId
- policy de RLS
- teste ou script de isolamento
- documentação no checklist

O contexto deve ser definido por:

```sql
SELECT set_config('app.current_tenant_id', '<tenant-id>', true);
```

Sempre que necessário, usar o utilitário:

```ts
import { runWithTenant } from "database";

await runWithTenant(tenantId, async (tx) => {
  // queries protegidas via tx
});
```

Scripts de hardening: `packages/database/sql/security/`

O usuário de banco da aplicação não deve ser owner das tabelas e não deve ter BYPASSRLS.

---

## 8. Validação de entrada

Toda entrada da API deve passar por DTO/schema.

Obrigatório:

- validar tipos
- validar campos obrigatórios
- bloquear campos extras quando possível
- evitar mass assignment
- nunca aceitar campos sensíveis sem regra explícita

Campos proibidos de aceitar diretamente em DTOs comuns:

- tenantId
- passwordHash
- role crítico sem permissão
- status crítico sem fluxo específico
- createdAt
- updatedAt
- audit fields

---

## 9. API response standard

Toda API deve seguir o padrão global de resposta.

Sucesso:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "string",
    "timestamp": "string"
  }
}
```

Lista paginada:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 100,
    "totalPages": 10
  },
  "meta": {
    "requestId": "string",
    "timestamp": "string"
  }
}
```

Erro:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem segura.",
    "details": []
  },
  "meta": {
    "requestId": "string",
    "timestamp": "string"
  }
}
```

Nunca expor stack trace em produção.

---

## 10. Audit logging

Toda ação sensível deve gerar AuditLog.

Exemplos:

- create, update, delete
- status change, permission change, role change, group change
- setting change, feature flag change
- session revoked, login failed, permission denied
- export, upload, approval/rejection

Audit log deve conter, quando aplicável:

- tenantId, userId, action, entity, entityId
- oldValue, newValue, metadata
- ipAddress, userAgent, requestId, createdAt

Nunca salvar senha, access token, refresh token ou secrets em audit log.

---

## 11. Settings

Se uma regra pode variar por empresa, ela deve ser candidata a TenantSetting.

Settings sensíveis devem exigir permissão forte (`settings.security.update`).

Alteração de setting deve gerar audit log.

---

## 12. Feature flags

Funcionalidade opcional, experimental ou dependente de plano deve usar Feature/TenantFeature.

O backend deve validar feature crítica.

O frontend pode ocultar menus e ações por feature, mas isso não substitui validação no backend.

---

## 13. Frontend

Toda tela interna deve usar o design system do Nexum Tower.

Obrigatório: AppShell, PageHeader, NexumCard, NexumDataTable, NexumBadge, NexumModal/NexumDrawer, NexumEmptyState, NexumSkeleton, NexumToast, PermissionGate, FeatureGate.

Menus, botões e ações devem respeitar permissões.

Se o usuário não tiver permissão para acessar uma página, redirecionar para `/access-denied`.

---

## 14. Estados de tela

Toda tela de dados deve ter: loading, empty, error, success feedback, paginação e filtros quando necessário.

---

## 15. Testes

Toda feature sensível deve ter testes.

Obrigatório considerar: permissão, tenant isolation, validação, auditoria, erro, acesso negado, feature flag, setting.

Novo módulo multi-tenant deve ter teste garantindo que tenant A não acessa tenant B.

---

## 16. Documentação

Toda implementação relevante deve atualizar documentação.

Arquivos principais:

- docs/SECURITY-GUARDRAILS.md
- docs/SECURITY-CHECKLIST.md
- docs/CURSOR-CORE-PLATFORM-RULES.md
- docs/API-STANDARDS.md
- docs/RBAC.md
- docs/RLS.md
- docs/AUDIT.md
- docs/SETTINGS.md
- docs/FEATURE-FLAGS.md
- docs/ROADMAP.md
- docs/ASYNC-JOBS.md
- docs/DLQ.md
- docs/OUTBOX-PATTERN.md
- docs/JOB-IDEMPOTENCY.md
- docs/JOB-OBSERVABILITY.md
- docs/JOB-SECURITY.md

---

## Async Jobs, Retry e DLQ

Toda funcionalidade assíncrona crítica deve avaliar:

- fila;
- retry;
- backoff;
- DLQ;
- Outbox Pattern;
- idempotência;
- audit log;
- payload seguro;
- tenant isolation;
- observabilidade;
- reprocessamento;
- feature flag, quando aplicável;
- settings, quando aplicável.

Não criar job crítico sem definir:

- nome da fila;
- tipo do job;
- tentativas;
- política de retry;
- critério de DLQ;
- estratégia de idempotência;
- eventos de auditoria;
- payload mínimo e seguro;
- forma de investigar falhas.

Anti-patterns proibidos (jobs):

- job sem tenantId;
- job sem idempotência quando gera efeito externo;
- job que salva token/senha no payload;
- job crítico sem retry;
- job crítico sem DLQ;
- job crítico sem auditoria;
- reprocessamento manual sem permissão;
- falha silenciosa sem log;
- evento crítico apenas em memória sem Outbox.

---

## 17. Anti-patterns proibidos

Nunca fazer:

- endpoint sem guard
- rota admin sem permissão
- query multi-tenant sem tenantId
- aceitar tenantId do frontend
- retornar passwordHash
- salvar token puro
- logar senha ou token
- criar tabela multi-tenant sem avaliar RLS
- alterar permissão sem auditoria
- alterar setting sem auditoria
- criar menu sem PermissionGate
- criar botão sensível sem PermissionGate
- criar módulo sem atualizar seed de permissões
- criar feature crítica sem feature flag
- criar API sem DTO
- criar API sem paginação para listas grandes
- expor stack trace em produção
- iniciar módulo operacional ignorando o checklist
- job crítico sem retry, DLQ, idempotência ou auditoria

---

## 18. Checklist rápido antes de concluir qualquer tarefa

- [ ] A feature respeita tenant isolation?
- [ ] A feature tem permissões?
- [ ] A feature usa guards?
- [ ] A feature valida DTO?
- [ ] A feature audita ações sensíveis?
- [ ] A feature precisa de settings?
- [ ] A feature precisa de feature flag?
- [ ] A feature precisa de RLS?
- [ ] A UI respeita PermissionGate?
- [ ] A UI tem loading/empty/error?
- [ ] Existem testes mínimos?
- [ ] A documentação foi atualizada?
- [ ] Jobs assíncronos críticos avaliam fila, retry, DLQ e idempotência?

---

## 19. Regra final

O Nexum Tower deve evoluir sempre como SaaS B2B seguro, multi-tenant e auditável.

Toda nova feature precisa nascer com segurança, governança e documentação.

Não deixar segurança para depois.
