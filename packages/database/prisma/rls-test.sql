-- Teste manual de isolamento RLS — Nexum Core Platform
--
-- Pré-requisito: as policies de RLS já aplicadas (migration 20260703140000_rls_core_platform)
-- e a tabela sob FORCE ROW LEVEL SECURITY OU execução por usuário sem BYPASSRLS.
--
-- Uso (psql):
--   \i packages/database/prisma/rls-test.sql
--
-- Substitua os IDs de tenant conforme o seu banco (SELECT id, slug FROM "Tenant";).

-- 1. Sem contexto de tenant: nenhuma linha deve aparecer (com FORCE RLS ativo).
RESET "app.current_tenant_id";
SELECT 'sem_contexto' AS cenario, count(*) AS usuarios_visiveis FROM "User";

-- 2. Com tenant A no contexto: apenas usuários do tenant A.
--    Troque '<TENANT_A_ID>' pelo id real.
SELECT set_config('app.current_tenant_id', '<TENANT_A_ID>', false);
SELECT 'tenant_a' AS cenario, count(*) AS usuarios_visiveis FROM "User";

-- 3. Com tenant B no contexto: dados do tenant A não devem aparecer.
SELECT set_config('app.current_tenant_id', '<TENANT_B_ID>', false);
SELECT 'tenant_b' AS cenario, count(*) AS usuarios_visiveis FROM "User";

-- Limpeza
RESET "app.current_tenant_id";
