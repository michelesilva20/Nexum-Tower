-- Nexum Tower — 06: Índices de hardening Branches (Fase 1.0.2)
-- Idempotente — seguro reexecutar após migrations 20260705110000 + 20260706120000

-- Matriz única (parcial — apenas ativas)
DROP INDEX IF EXISTS "Branch_one_headquarters_per_tenant_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "Branch_one_headquarters_per_tenant_idx"
  ON "Branch" ("tenantId")
  WHERE "isHeadquarters" = true AND "deletedAt" IS NULL;

-- code: permanente por tenant (inclui soft-deleted) — Fase 1.0.2
DROP INDEX IF EXISTS "Branch_tenantId_code_active_key";
DROP INDEX IF EXISTS "Branch_tenantId_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Branch_tenantId_code_key"
  ON "Branch" ("tenantId", "code");

-- documentNumber: parcial entre ativas quando informado
DROP INDEX IF EXISTS "Branch_tenantId_documentNumber_key";
DROP INDEX IF EXISTS "Branch_tenantId_documentNumber_active_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Branch_tenantId_documentNumber_active_key"
  ON "Branch" ("tenantId", "documentNumber")
  WHERE "deletedAt" IS NULL AND "documentNumber" IS NOT NULL;
