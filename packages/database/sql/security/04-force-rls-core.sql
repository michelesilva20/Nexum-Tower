-- Nexum Tower — 04: FORCE ROW LEVEL SECURITY
--
-- ⚠️ ATENÇÃO: aplicar SOMENTE quando:
--   1. A API conectar com nexum_app (não postgres/owner)
--   2. runWithTenant estiver em uso nas queries tenant-aware
--   3. Scripts 01–03 já executados
--
-- Em dev local com postgres owner, FORCE RLS pode bloquear queries sem contexto.
-- Recomendado: staging/prod com DATABASE_URL apontando para nexum_app.
--
-- Uso:
--   psql -U postgres -d nexum_tower -f packages/database/sql/security/04-force-rls-core.sql
--
-- Reverter (emergência dev):
--   ALTER TABLE "User" NO FORCE ROW LEVEL SECURITY;
--   (repetir para cada tabela abaixo)

ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Group" FORCE ROW LEVEL SECURITY;
ALTER TABLE "GroupMember" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserRole" FORCE ROW LEVEL SECURITY;
ALTER TABLE "GroupRole" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserPermissionOverride" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuthSession" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TenantSetting" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TenantFeature" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Role" FORCE ROW LEVEL SECURITY;
