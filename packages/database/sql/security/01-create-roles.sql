-- Nexum Tower — 01: Criar papéis PostgreSQL
--
-- Executar como superuser (postgres) APÓS criar o banco nexum_tower.
-- NÃO use senhas reais de produção — altere antes de aplicar em staging/prod.
--
-- Uso:
--   psql -U postgres -d nexum_tower -f packages/database/sql/security/01-create-roles.sql
--
-- Windows (PowerShell):
--   psql $env:DATABASE_URL -f packages/database/sql/security/01-create-roles.sql

-- Owner/migrator: migrations, seeds administrativos, DDL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexum_migrator') THEN
    CREATE ROLE nexum_migrator LOGIN PASSWORD 'change_me_migrator_password';
  END IF;
END
$$;

-- App user: runtime da API — SEM superuser, SEM BYPASSRLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexum_app') THEN
    CREATE ROLE nexum_app LOGIN PASSWORD 'change_me_app_password';
  END IF;
END
$$;

-- Garantias explícitas (idempotente)
ALTER ROLE nexum_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
ALTER ROLE nexum_migrator NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;

COMMENT ON ROLE nexum_migrator IS 'Nexum Tower — migrations e DDL apenas';
COMMENT ON ROLE nexum_app IS 'Nexum Tower — runtime da API com RLS efetivo';
