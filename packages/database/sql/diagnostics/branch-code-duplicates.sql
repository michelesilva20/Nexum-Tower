-- Nexum Tower — Diagnóstico: duplicidade de Branch.code por tenant
-- Executar antes de aplicar índice permanente tenantId + code (Fase 1.0.2)
-- Resultado esperado: zero linhas

SELECT
  "tenantId",
  "code",
  COUNT(*) AS total,
  array_agg("id" ORDER BY "createdAt") AS branch_ids,
  array_agg(CASE WHEN "deletedAt" IS NULL THEN 'active' ELSE 'deleted' END ORDER BY "createdAt") AS statuses
FROM "Branch"
GROUP BY "tenantId", "code"
HAVING COUNT(*) > 1;
