# Fase 1.0.2 — Fechamento 10/10 de Filiais

> **Documento de entrega** · julho/2026  
> **Status:** ✅ concluído — **10/10 para desenvolvimento**

Documentos relacionados: [FASE-1.0-FILIAIS.md](./FASE-1.0-FILIAIS.md) · [FASE-1.0.1-HARDENING.md](./FASE-1.0.1-HARDENING.md) · [FASE-1.0.1-O-QUE-FOI-FEITO.md](./FASE-1.0.1-O-QUE-FOI-FEITO.md) · [FASE-1.0.2-O-QUE-FOI-FEITO.md](./FASE-1.0.2-O-QUE-FOI-FEITO.md) (explicação em linguagem clara)

---

## 1. Problema corrigido — Branch.code

A Fase 1.0.1 documentava que `code` não podia ser reutilizado após soft delete, mas o banco usava índice parcial `Branch_tenantId_code_active_key`, permitindo reutilização na prática.

### Decisão oficial

```txt
tenantId + code = único permanentemente
code NÃO pode ser reutilizado após soft delete
```

### Diferença vs documentNumber

| Campo | Regra |
|-------|--------|
| **code** | Identidade operacional permanente — único em **todos** os registros |
| **documentNumber** | Opcional; múltiplos NULL; único entre filiais **ativas** quando informado |

> **Nota:** A Fase 1.0.1 tinha documentação correta mas implementação de banco inconsistente — corrigido nesta fase.

---

## 2. Pré-check de duplicidade

```bash
pnpm db:check:branch-code-duplicates
```

**Resultado:** OK — zero duplicidades. Migration aplicada com segurança.

---

## 3. Migration `20260706120000_branch_code_permanent_unique`

- Remove `Branch_tenantId_code_active_key`
- Cria `Branch_tenantId_code_key` (permanente)
- Schema Prisma: `@@unique([tenantId, code])`

---

## 4. Índices finais

| Índice | Regra |
|--------|--------|
| `Branch_tenantId_code_key` | Permanente por tenant |
| `Branch_one_headquarters_per_tenant_idx` | Uma matriz ativa |
| `Branch_tenantId_documentNumber_active_key` | Documento entre ativos |

---

## 5. Backend

- `assertUniqueCode` verifica todos os registros (inclui soft-deleted)
- Mensagem: *"Não é possível reutilizar este código de filial. Ele já foi usado neste tenant."*
- **4 novos testes** — total API **82/82**

---

## 6. Frontend

Toast de erro da API; modal permanece aberto em conflito de code (já implementado).

---

## 7. E2E Playwright — ✅ 7/7

Correções:

- Login: submit do form (evita clique em SSO)
- Locators: `span.font-mono` para codes
- Seed: `logistics-operator` recebe `branches.read`
- `pnpm dev:e2e` (migrate + seed + dev)
- `pnpm test:e2e:install` para browsers

Specs: `tests/e2e/branches.spec.ts`

---

## 8. RLS

- Scripts prontos; procedimento em [RLS.md](./modules/organization/RLS.md)
- `pnpm security:rls:test` — **não executável** no Windows local (`psql` ausente, Docker parado)
- **Não bloqueia dev**; **bloqueia produção**

---

## 9. Validação final

| Comando | Resultado |
|---------|-----------|
| `pnpm db:check:branch-code-duplicates` | ✅ OK |
| `pnpm db:migrate:deploy` | ✅ OK |
| `pnpm db:seed` | ✅ OK |
| `pnpm typecheck` | ✅ OK |
| `pnpm lint` | ✅ OK |
| `pnpm test:api` | ✅ **82/82** |
| `pnpm build` | ✅ OK |
| `pnpm test:e2e` (branches) | ✅ **7/7** |
| `pnpm security:rls:test` | ❌ psql ausente (procedimento documentado) |

---

## 10. GO / NO-GO

| Contexto | Decisão |
|----------|---------|
| **Iniciar Customers (dev)** | ✅ **GO** |
| **Produção** | ⚠️ **NO-GO** até FORCE RLS + `security:rls:test` |

---

## 11. Próximo passo

**Fase 1.1 — Customers + CustomerBranch** (`Customer` global + vínculo `CustomerBranch`)
