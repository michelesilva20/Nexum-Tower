-- Nexum Tower — RLS hardening: Driver + DriverBranch (idempotente)
-- Executar após migration 20260706160000_add_drivers

ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Driver_tenant_isolation" ON "Driver";
CREATE POLICY "Driver_tenant_isolation" ON "Driver"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "DriverBranch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "DriverBranch_tenant_isolation" ON "DriverBranch";
CREATE POLICY "DriverBranch_tenant_isolation" ON "DriverBranch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
