-- Nexum Tower — RLS hardening: Location + LocationBranch (idempotente)
-- Executar após migration 20260706150000_add_locations

ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Location_tenant_isolation" ON "Location";
CREATE POLICY "Location_tenant_isolation" ON "Location"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "LocationBranch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "LocationBranch_tenant_isolation" ON "LocationBranch";
CREATE POLICY "LocationBranch_tenant_isolation" ON "LocationBranch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
