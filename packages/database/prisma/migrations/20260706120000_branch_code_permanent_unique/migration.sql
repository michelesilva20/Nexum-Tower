-- Nexum Tower — Fase 1.0.2: Branch.code único permanente por tenant
--
-- Decisão oficial:
--   tenantId + code é único em TODOS os registros (inclui soft-deleted)
--   code NÃO pode ser reutilizado após soft delete
--
-- Pré-check obrigatório (zero duplicidades):
--   pnpm db:check:branch-code-duplicates
--
-- documentNumber mantém índice parcial (unicidade entre ativos quando informado)

-- ─── Remover índice parcial de code ─────────────────────────────────────────

DROP INDEX IF EXISTS "Branch_tenantId_code_active_key";

-- ─── Índice permanente tenantId + code ──────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "Branch_tenantId_code_key"
  ON "Branch" ("tenantId", "code");

-- Matriz única e documentNumber parcial permanecem inalterados (migration 20260705110000)
