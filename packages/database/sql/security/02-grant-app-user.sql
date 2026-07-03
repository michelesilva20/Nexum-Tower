-- Nexum Tower — 02: Grants mínimos para nexum_app
--
-- Pré-requisito: 01-create-roles.sql
-- Executar como owner das tabelas (postgres ou nexum_migrator após transferência).
--
-- nexum_app NÃO é owner das tabelas e NÃO possui BYPASSRLS.

GRANT CONNECT ON DATABASE nexum_tower TO nexum_app;
GRANT CONNECT ON DATABASE nexum_tower TO nexum_migrator;

GRANT USAGE ON SCHEMA public TO nexum_app;
GRANT USAGE ON SCHEMA public TO nexum_migrator;

-- DML nas tabelas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexum_app;

-- Sequences (cuid para novos IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexum_app;

-- Migrator precisa de DDL
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nexum_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nexum_migrator;

-- Objetos futuros criados pelo migrator
ALTER DEFAULT PRIVILEGES FOR ROLE nexum_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexum_app;

ALTER DEFAULT PRIVILEGES FOR ROLE nexum_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO nexum_app;

-- Se tabelas ainda pertencem a postgres, repetir default privileges:
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexum_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO nexum_app;
