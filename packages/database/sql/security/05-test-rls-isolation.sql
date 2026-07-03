-- Nexum Tower — 05: Teste manual de isolamento RLS
--
-- Pré-requisitos:
--   - Migrations aplicadas (policies ativas)
--   - FORCE RLS aplicado (04) OU execução como nexum_app (recomendado)
--   - Seed executado (pnpm db:seed)
--
-- Uso:
--   psql "postgresql://nexum_app:change_me_app_password@localhost:5432/nexum_tower" \
--     -f packages/database/sql/security/05-test-rls-isolation.sql
--
-- Resultado esperado (com FORCE RLS ou nexum_app):
--   sem_contexto  → 0 usuários visíveis
--   tenant_demo   → N usuários do tenant nexum-demo
--   tenant_fake   → 0 usuários (tenant inexistente)

\echo '=== Nexum RLS Isolation Test ==='

-- Resolver tenant demo automaticamente (slug nexum-demo do seed)
\set tenant_demo_id `SELECT id FROM "Tenant" WHERE slug = 'nexum-demo' LIMIT 1`

\echo '1. Sem contexto de tenant'
SELECT set_config('app.current_tenant_id', '', true);
SELECT 'sem_contexto' AS cenario, count(*)::int AS usuarios_visiveis FROM "User";

\echo '2. Com tenant demo no contexto'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'tenant_demo' AS cenario, count(*)::int AS usuarios_visiveis FROM "User";

\echo '3. Com tenant inexistente no contexto'
SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true);
SELECT 'tenant_inexistente' AS cenario, count(*)::int AS usuarios_visiveis FROM "User";

\echo '4. Cross-tenant: usuários do demo não devem aparecer com tenant fake'
SELECT set_config('app.current_tenant_id', 'tenant-b-fake-id', true);
SELECT 'tenant_fake' AS cenario, count(*)::int AS usuarios_visiveis FROM "User";

\echo '5. Limpeza'
SELECT set_config('app.current_tenant_id', '', true);

\echo '=== Fim do teste ==='
\echo 'Esperado: sem_contexto=0, tenant_demo>0, demais=0 (com FORCE RLS ou nexum_app)'
