-- Nexum Tower — RLS hardening: Route + RouteBranch + RoutePoint (idempotente)
-- Executar após migration 20260706180000_add_routes

ALTER TABLE "Route" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Route_tenant_isolation" ON "Route";
CREATE POLICY "Route_tenant_isolation" ON "Route"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "RouteBranch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RouteBranch_tenant_isolation" ON "RouteBranch";
CREATE POLICY "RouteBranch_tenant_isolation" ON "RouteBranch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "RoutePoint" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RoutePoint_tenant_isolation" ON "RoutePoint";
CREATE POLICY "RoutePoint_tenant_isolation" ON "RoutePoint"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
