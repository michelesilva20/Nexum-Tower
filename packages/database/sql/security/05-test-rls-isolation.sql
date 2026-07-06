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

\echo '6. Branch — isolamento por tenant'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'branch_tenant_demo' AS cenario, count(*)::int AS filiais_visiveis FROM "Branch";

\echo '7. Branch — sem contexto'
SELECT set_config('app.current_tenant_id', '', true);
SELECT 'branch_sem_contexto' AS cenario, count(*)::int AS filiais_visiveis FROM "Branch";

\echo '8. UserBranchAccess — isolamento por tenant'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'uba_tenant_demo' AS cenario, count(*)::int AS vinculos_visiveis FROM "UserBranchAccess";

\echo '9. Customer — isolamento por tenant'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'customer_tenant_demo' AS cenario, count(*)::int AS clientes_visiveis FROM "Customer";

\echo '10. Customer — sem contexto'
SELECT set_config('app.current_tenant_id', '', true);
SELECT 'customer_sem_contexto' AS cenario, count(*)::int AS clientes_visiveis FROM "Customer";

\echo '11. CustomerBranch — isolamento por tenant'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'customer_branch_tenant_demo' AS cenario, count(*)::int AS vinculos_visiveis FROM "CustomerBranch";

\echo '12. Location — isolamento por tenant'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'location_tenant_demo' AS cenario, count(*)::int AS locais_visiveis FROM "Location";

\echo '13. Location — sem contexto'
SELECT set_config('app.current_tenant_id', '', true);
SELECT 'location_sem_contexto' AS cenario, count(*)::int AS locais_visiveis FROM "Location";

\echo '14. Driver — isolamento por tenant'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'driver_tenant_demo' AS cenario, count(*)::int AS motoristas_visiveis FROM "Driver";

\echo '15. Driver — sem contexto'
SELECT set_config('app.current_tenant_id', '', true);
SELECT 'driver_sem_contexto' AS cenario, count(*)::int AS motoristas_visiveis FROM "Driver";

\echo '16. DriverBranch — isolamento por tenant'
SELECT set_config('app.current_tenant_id', :'tenant_demo_id', true);
SELECT 'driver_branch_tenant_demo' AS cenario, count(*)::int AS vinculos_visiveis FROM "DriverBranch";

\echo '=== Fim do teste ==='
\echo 'Esperado: sem_contexto=0, tenant_demo>0, demais=0 (com FORCE RLS ou nexum_app)'
\echo 'Branch/UBA/Customer: tenant_demo>0 após seed, sem_contexto=0'
