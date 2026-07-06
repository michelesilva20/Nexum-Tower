-- Nexum Tower — 03: Habilitar RLS nas tabelas Core multi-tenant
--
-- Idempotente: seguro reexecutar após migrations Prisma.
-- As migrations 20260703140000 e 20260703150000 já aplicam policies equivalentes.
-- Este script serve para ambientes novos, auditoria ou reparo manual.
--
-- Contexto: app.current_tenant_id via runWithTenant (packages/database/src/tenant-context.ts)

-- ─── Tabelas com tenantId direto ───────────────────────────────────────────

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User_tenant_isolation" ON "User";
CREATE POLICY "User_tenant_isolation" ON "User"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "Group" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group_tenant_isolation" ON "Group";
CREATE POLICY "Group_tenant_isolation" ON "Group"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "GroupMember" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "GroupMember_tenant_isolation" ON "GroupMember";
CREATE POLICY "GroupMember_tenant_isolation" ON "GroupMember"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserRole_tenant_isolation" ON "UserRole";
CREATE POLICY "UserRole_tenant_isolation" ON "UserRole"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "GroupRole" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "GroupRole_tenant_isolation" ON "GroupRole";
CREATE POLICY "GroupRole_tenant_isolation" ON "GroupRole"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "UserPermissionOverride" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserPermissionOverride_tenant_isolation" ON "UserPermissionOverride";
CREATE POLICY "UserPermissionOverride_tenant_isolation" ON "UserPermissionOverride"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "AuthSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AuthSession_tenant_isolation" ON "AuthSession";
CREATE POLICY "AuthSession_tenant_isolation" ON "AuthSession"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AuditLog_tenant_isolation" ON "AuditLog";
CREATE POLICY "AuditLog_tenant_isolation" ON "AuditLog"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "TenantSetting" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "TenantSetting_tenant_isolation" ON "TenantSetting";
CREATE POLICY "TenantSetting_tenant_isolation" ON "TenantSetting"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "TenantFeature" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "TenantFeature_tenant_isolation" ON "TenantFeature";
CREATE POLICY "TenantFeature_tenant_isolation" ON "TenantFeature"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Branch_tenant_isolation" ON "Branch";
CREATE POLICY "Branch_tenant_isolation" ON "Branch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "UserBranchAccess" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserBranchAccess_tenant_isolation" ON "UserBranchAccess";
CREATE POLICY "UserBranchAccess_tenant_isolation" ON "UserBranchAccess"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

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

-- ─── Role (tenantId nullable — papéis de sistema são globais) ──────────────

ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Role_tenant_isolation" ON "Role";
CREATE POLICY "Role_tenant_isolation" ON "Role"
  USING (
    "tenantId" IS NULL
    OR "tenantId" = current_setting('app.current_tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId" = current_setting('app.current_tenant_id', true)
  );

-- ─── Tabelas SEM tenantId (propositalmente sem RLS por tenant) ─────────────
-- Permission: catálogo global (seed) — isolamento via app layer.
-- RolePermission: junção role↔permission — protegida via Role + app layer.
-- SettingDefinition, Feature: catálogo global.
-- Tenant: tabela raiz — acesso controlado pela aplicação, não por RLS de tenant filho.
