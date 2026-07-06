-- Nexum Tower — RLS hardening: Vehicle + VehicleBranch (idempotente)
-- Executar após migration 20260706170000_add_vehicles

ALTER TABLE "Vehicle" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vehicle_tenant_isolation" ON "Vehicle";
CREATE POLICY "Vehicle_tenant_isolation" ON "Vehicle"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "VehicleBranch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "VehicleBranch_tenant_isolation" ON "VehicleBranch";
CREATE POLICY "VehicleBranch_tenant_isolation" ON "VehicleBranch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
