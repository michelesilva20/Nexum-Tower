-- Nexum Core Platform — Row Level Security (preparação)
--
-- Habilita RLS e cria policies de isolamento por tenant nas tabelas core.
-- As policies usam o contexto `app.current_tenant_id` definido por
-- runWithTenant() (packages/database/src/tenant-context.ts).
--
-- IMPORTANTE: FORCE ROW LEVEL SECURITY NÃO é ativado aqui de propósito.
-- Com o usuário de banco atual (dono das tabelas), o RLS não altera o
-- comportamento existente — as policies ficam prontas e testáveis, mas só
-- passam a bloquear de fato quando a aplicação conectar com um usuário de
-- baixo privilégio (sem BYPASSRLS) ou quando FORCE for habilitado.
-- Ver docs/RLS.md para o passo a passo de ativação completa.

-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User_tenant_isolation" ON "User"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- Group
ALTER TABLE "Group" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group_tenant_isolation" ON "Group"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- GroupMember
ALTER TABLE "GroupMember" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GroupMember_tenant_isolation" ON "GroupMember"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- UserRole
ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UserRole_tenant_isolation" ON "UserRole"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- GroupRole
ALTER TABLE "GroupRole" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GroupRole_tenant_isolation" ON "GroupRole"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- UserPermissionOverride
ALTER TABLE "UserPermissionOverride" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UserPermissionOverride_tenant_isolation" ON "UserPermissionOverride"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- AuthSession
ALTER TABLE "AuthSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AuthSession_tenant_isolation" ON "AuthSession"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AuditLog_tenant_isolation" ON "AuditLog"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
