-- Nexum Tower — Branches hardening (Fase 1.0.1)
--
-- 1. Índice único parcial: apenas uma matriz ativa por tenant (soft delete aware)
-- 2. Índices parciais de unicidade ativa para code e documentNumber (apenas deletedAt IS NULL)
--
-- Decisões:
-- - code de filial soft-deleted NÃO pode ser reutilizado (histórico/auditoria)
-- - documentNumber opcional; múltiplos NULL permitidos; quando informado, único entre ativos

-- ─── Matriz única por tenant ───────────────────────────────────────────────

DROP INDEX IF EXISTS "Branch_one_headquarters_per_tenant_idx";
CREATE UNIQUE INDEX "Branch_one_headquarters_per_tenant_idx"
  ON "Branch" ("tenantId")
  WHERE "isHeadquarters" = true AND "deletedAt" IS NULL;

-- ─── Unicidade entre filiais ATIVAS (não deletadas) ────────────────────────
-- Substitui índices Prisma @@unique que não consideravam soft delete na aplicação.

DROP INDEX IF EXISTS "Branch_tenantId_code_key";
CREATE UNIQUE INDEX "Branch_tenantId_code_active_key"
  ON "Branch" ("tenantId", "code")
  WHERE "deletedAt" IS NULL;

DROP INDEX IF EXISTS "Branch_tenantId_documentNumber_key";
CREATE UNIQUE INDEX "Branch_tenantId_documentNumber_active_key"
  ON "Branch" ("tenantId", "documentNumber")
  WHERE "deletedAt" IS NULL AND "documentNumber" IS NOT NULL;
