-- Nexum Tower — 07: RLS hardening Customer + CustomerBranch
--
-- Idempotente. Complementa migration 20260706140000_add_customers.

ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer_tenant_isolation" ON "Customer";
CREATE POLICY "Customer_tenant_isolation" ON "Customer"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "CustomerBranch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CustomerBranch_tenant_isolation" ON "CustomerBranch";
CREATE POLICY "CustomerBranch_tenant_isolation" ON "CustomerBranch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
