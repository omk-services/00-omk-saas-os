-- ============================================================
-- OMK Dashboard — PG ROLES PROVISIONNING (DRAFT for HITL)
-- Status: AWAITING ADR-OMK-002 ratification
-- ADR: C:\Users\amado\ASpace_OS_V2\_SPECS\ADR\ADR-OMK-002_pg-roles-provisionning.md
-- Date: 2026-06-11
-- Doctrine: schema-strict (omk_internal + omk_saas SEULEMENT) — least privilege strict
-- Idempotent: ré-exécutable sans casse (DO $$ + IF NOT EXISTS + IF EXISTS)
-- Keyless: aucun secret en clair, utilise env var PGPASSWORD (User Windows scope)
-- ============================================================
--
-- HitL executor: A2 (Claude Code) après Go A0.
-- Command (depuis Windows A0):
--   scp .../06_provision_pg_roles_omk.sql srv941028:/tmp/
--   ssh srv941028 "PGUSER=postgres PGPASSWORD=\"$SUPABASE_DB_PASSWORD\" \
--     psql -h localhost -p 5432 -U postgres -d postgres \
--          --set ON_ERROR_STOP=on -f /tmp/06_provision_pg_roles_omk.sql"
--
-- ROLLBACK: même fichier, exécuté avec -v section=rollback (voir fin du fichier).
--
-- Postgres doc citations (vérifiées via context7 /websites/postgresql_current) :
--   sql-createrole.html         — NOLOGIN / NOSUPERUSER / NOINHERIT
--   sql-grant.html              — GRANT ON SCHEMA / TABLES / SEQUENCES
--   sql-alterdefaultprivileges.html — ALTER DEFAULT PRIVILEGES FOR ROLE IN SCHEMA
--   role-removal.html           — REASSIGN OWNED / DROP OWNED / DROP ROLE
--   plpgsql-control-structures.html — EXCEPTION WHEN duplicate_object (idempotence)
--   app-psql.html               — ON_ERROR_STOP variable
-- ============================================================

-- ============================================================
-- 0. SANITY CHECKS (avant de toucher aux rôles)
-- ============================================================

-- Refuse d'exécuter si on n'est pas connecté en tant que superuser (postgres).
-- Source: context7 sql-createrole.html — "Creating a new superuser requires existing superuser privileges."
DO $$
DECLARE
  v_is_superuser boolean;
  v_has_bypassrls boolean;
BEGIN
  SELECT rolsuper, rolbypassrls INTO v_is_superuser, v_has_bypassrls FROM pg_roles WHERE rolname = current_user;
  IF v_is_superuser IS NULL OR (v_is_superuser = false AND current_user <> 'supabase_admin' AND (v_has_bypassrls IS DISTINCT FROM true)) THEN
    RAISE EXCEPTION 'This script must be run as a superuser (postgres / supabase_admin) or a BYPASSRLS role. Current user: %', current_user;
  END IF;
  RAISE NOTICE 'Sanity check OK: current user % is authorized (superuser or BYPASSRLS)', current_user;
END
$$;

-- Affiche le mode d'exécution (provisioning par défaut, rollback si demandé)
\set ON_ERROR_STOP on
\echo ''
\echo '==== OMK PG Roles Provisionning — section=':section :'===='
\echo ''

-- ============================================================
-- 1. CREATE ROLES (NOLOGIN, NOSUPERUSER, NOINHERIT)
-- ============================================================
-- Postgres doc: sql-createrole.html (INHERIT/NOINHERIT, SUPERUSER/NOSUPERUSER)
-- NOLOGIN: le rôle est un "grant role" — pas un login SQL.
--   service_role key Supabase reste le canal d'auth pour aspace_admin via MCP.
-- NOINHERIT: si un jour aspace_observer est ajouté comme membre, il n'héritera pas
--   automatiquement des GRANTs de aspace_admin (cf. ADR-OMK-002 D5).
-- NOSUPERUSER: default, explicité pour traçabilité audit.
-- Idempotent: IF NOT EXISTS via pg_roles lookup.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aspace_admin') THEN
    CREATE ROLE aspace_admin NOLOGIN NOSUPERUSER NOINHERIT;
    RAISE NOTICE 'Created role: aspace_admin';
  ELSE
    RAISE NOTICE 'Role aspace_admin already exists — skipping CREATE';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aspace_observer') THEN
    CREATE ROLE aspace_observer NOLOGIN NOSUPERUSER NOINHERIT;
    RAISE NOTICE 'Created role: aspace_observer';
  ELSE
    RAISE NOTICE 'Role aspace_observer already exists — skipping CREATE';
  END IF;
END
$$;

-- ============================================================
-- 2. aspace_admin GRANTS — schema USAGE+CREATE
-- ============================================================
-- Postgres doc: sql-grant.html (Grant Schema Privileges)
-- USAGE = accès aux objets du schéma ; CREATE = créer de nouveaux objets.

GRANT USAGE, CREATE ON SCHEMA omk_internal TO aspace_admin;
GRANT USAGE, CREATE ON SCHEMA omk_saas     TO aspace_admin;

-- ============================================================
-- 3. aspace_admin GRANTS — ALL TABLES (DDL + DML)
-- ============================================================
-- Postgres doc: sql-grant.html (Grant Table Privileges)
-- SELECT/INSERT/UPDATE/DELETE = DML
-- REFERENCES = créer des FK vers ces tables
-- TRIGGER = créer des triggers sur ces tables

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA omk_internal TO aspace_admin;
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA omk_saas     TO aspace_admin;

-- ============================================================
-- 4. aspace_admin GRANTS — ALL SEQUENCES
-- ============================================================
-- Postgres doc: sql-grant.html (sequences = USAGE|SELECT|UPDATE)
-- USAGE = nextval() ; SELECT = currval()

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA omk_internal TO aspace_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA omk_saas     TO aspace_admin;

-- ============================================================
-- 5. aspace_admin DEFAULT PRIVILEGES — futures tables
-- ============================================================
-- Postgres doc: sql-alterdefaultprivileges.html
-- "FOR ROLE postgres" = le rôle qui CRÉERA les futures tables (owner).
-- Couvre les tables/sequences créés APRÈS ce provisionning par postgres
-- (donc indirectement par aspace_admin via SET ROLE, ou directement).
-- Note: ces ALTER DEFAULT PRIVILEGES sont scoped à la session courante
-- (par défaut), et sont stockés dans pg_db_role_setting.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_internal
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO aspace_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_saas
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO aspace_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_internal
  GRANT USAGE, SELECT ON SEQUENCES TO aspace_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_saas
  GRANT USAGE, SELECT ON SEQUENCES TO aspace_admin;

-- ============================================================
-- 6. aspace_observer GRANTS — schema USAGE only (no CREATE)
-- ============================================================
-- READ-ONLY strict. PAS de CREATE. Si l'observer a besoin d'un nouveau
-- objet, il escalade vers aspace_admin (HITL).

GRANT USAGE ON SCHEMA omk_internal TO aspace_observer;
GRANT USAGE ON SCHEMA omk_saas     TO aspace_observer;

-- ============================================================
-- 7. aspace_observer GRANTS — ALL TABLES SELECT only
-- ============================================================
-- SELECT only. Aucun DML, aucun DDL.

GRANT SELECT ON ALL TABLES IN SCHEMA omk_internal TO aspace_observer;
GRANT SELECT ON ALL TABLES IN SCHEMA omk_saas     TO aspace_observer;

-- ============================================================
-- 8. aspace_observer GRANTS — ALL SEQUENCES SELECT only
-- ============================================================
-- SELECT only (currval). PAS de USAGE (nextval) — observer ne consomme
-- pas de nouvelles valeurs de séquence (c'est du DML déguisé).

GRANT SELECT ON ALL SEQUENCES IN SCHEMA omk_internal TO aspace_observer;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA omk_saas     TO aspace_observer;

-- ============================================================
-- 9. aspace_observer DEFAULT PRIVILEGES — futures tables
-- ============================================================

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_internal
  GRANT SELECT ON TABLES TO aspace_observer;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_saas
  GRANT SELECT ON TABLES TO aspace_observer;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_internal
  GRANT SELECT ON SEQUENCES TO aspace_observer;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA omk_saas
  GRANT SELECT ON SEQUENCES TO aspace_observer;

-- ============================================================
-- 10. DEFENSE IN DEPTH — REVOKE sur les schémas réservés Supabase
-- ============================================================
-- Pas de GRANT USAGE explicite nécessaire (défaut: pas d'accès pour rôle custom).
-- Mais pour traçabilité audit + explicite "no entry", on émet des REVOKE idempotents.
-- Postgres doc: sql-revoke.html
-- Idempotent: REVOKE sur un privilège non-granté est un no-op (pas d'erreur).

REVOKE ALL ON SCHEMA auth              FROM aspace_admin;
REVOKE ALL ON SCHEMA storage           FROM aspace_admin;
REVOKE ALL ON SCHEMA realtime          FROM aspace_admin;
REVOKE ALL ON SCHEMA graphql_public    FROM aspace_admin;
REVOKE ALL ON SCHEMA extensions        FROM aspace_admin;
REVOKE ALL ON SCHEMA vault             FROM aspace_admin;
-- REVOKE guarded: pgsodium, supabase_functions, pgbouncer may be absent on Supabase self-hosted
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pgsodium')          THEN REVOKE ALL ON SCHEMA pgsodium          FROM aspace_admin; END IF; IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'supabase_functions') THEN REVOKE ALL ON SCHEMA supabase_functions FROM aspace_admin; END IF; IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pgbouncer')         THEN REVOKE ALL ON SCHEMA pgbouncer         FROM aspace_admin; END IF; END $$;

REVOKE ALL ON SCHEMA auth              FROM aspace_observer;
REVOKE ALL ON SCHEMA storage           FROM aspace_observer;
REVOKE ALL ON SCHEMA realtime          FROM aspace_observer;
REVOKE ALL ON SCHEMA graphql_public    FROM aspace_observer;
REVOKE ALL ON SCHEMA extensions        FROM aspace_observer;
REVOKE ALL ON SCHEMA vault             FROM aspace_observer;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pgsodium')          THEN REVOKE ALL ON SCHEMA pgsodium          FROM aspace_observer; END IF; IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'supabase_functions') THEN REVOKE ALL ON SCHEMA supabase_functions FROM aspace_observer; END IF; IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pgbouncer')         THEN REVOKE ALL ON SCHEMA pgbouncer         FROM aspace_observer; END IF; END $$;

-- ============================================================
-- 11. POST-PROVISIONNING VERIFY (lecture seule)
-- ============================================================
-- Affiche l'état final pour validation A0.
-- Ces SELECTs ne modifient rien.

\echo ''
\echo '==== POST-PROVISIONNING VERIFY (read-only) ===='
\echo ''

\echo '-- ROLES --'
SELECT rolname, rolcanlogin, rolinherit, rolsuper, rolcreaterole, rolcreatedb
  FROM pg_roles
  WHERE rolname IN ('aspace_admin', 'aspace_observer')
  ORDER BY rolname;

\echo ''
\echo '-- aspace_admin GRANTS on SCHEMAS --'
SELECT n.nspname AS schema,
       has_schema_privilege('aspace_admin', n.oid, 'USAGE')   AS admin_usage,
       has_schema_privilege('aspace_admin', n.oid, 'CREATE')  AS admin_create,
       has_schema_privilege('aspace_observer', n.oid, 'USAGE') AS obs_usage
  FROM pg_namespace n
  WHERE n.nspname IN ('omk_internal', 'omk_saas',
                      'auth', 'storage', 'realtime', 'graphql_public',
                      'extensions', 'vault', 'pgsodium', 'supabase_functions', 'pgbouncer')
  ORDER BY n.nspname;

\echo ''
\echo '-- aspace_observer GRANTS on TABLES (sample) --'
SELECT schemaname, tablename,
       has_table_privilege('aspace_observer', schemaname || '.' || tablename, 'SELECT') AS obs_select,
       has_table_privilege('aspace_observer', schemaname || '.' || tablename, 'INSERT') AS obs_insert
  FROM pg_tables
  WHERE schemaname IN ('omk_internal', 'omk_saas')
  ORDER BY schemaname, tablename
  LIMIT 20;

\echo ''
\echo '-- DEFAULT PRIVILEGES set by this script --'
SELECT pg_get_userbyid(d.defaclrole) AS for_role,
       n.nspname AS in_schema,
       CASE d.defaclobjtype
         WHEN 'r' THEN 'TABLE'
         WHEN 'S' THEN 'SEQUENCE'
         WHEN 'f' THEN 'FUNCTION'
         WHEN 'T' THEN 'TYPE'
         WHEN 'n' THEN 'SCHEMA'
         ELSE d.defaclobjtype::text
       END AS obj_type,
       pg_get_userbyid(d.defaclrole) AS to_role,
       d.defaclacl AS privileges
  FROM pg_default_acl d
  LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE pg_get_userbyid(d.defaclrole) = 'postgres'
    AND pg_get_userbyid(d.defaclrole) IN ('aspace_admin', 'aspace_observer')
  ORDER BY n.nspname, obj_type, to_role;

\echo ''
\echo '==== PROVISIONNING COMPLETE ===='
\echo 'Next steps:'
\echo '  1. As aspace_observer, try: SELECT * FROM auth.users LIMIT 1;  -- MUST FAIL'
\echo '  2. As aspace_observer, try: SELECT * FROM storage.objects LIMIT 1;  -- MUST FAIL'
\echo '  3. As aspace_admin,   try: SELECT * FROM omk_saas.organizations;  -- MUST SUCCEED'
\echo '  4. Update omk/apps/dashboard/AGENTS.md §1.2 to "RATIFIED (ADR-OMK-002)"'
\echo '  5. Append wiki log entry under 2026-06-11'
\echo ''

-- ============================================================
-- 12. ROLLBACK SECTION (manual invocation only)
-- ============================================================
-- To execute rollback, run with: psql -v section=rollback -f 06_provision_pg_roles_omk.sql
-- Postgres doc: role-removal.html — General Role Removal Recipe
--   REASSIGN OWNED BY doomed_role TO successor_role;  -- (omis: roles OMK n'ownent rien)
--   DROP OWNED BY doomed_role;                        -- révoque les GRANTs
--   DROP ROLE doomed_role;
-- Idempotent: ré-exécutable sans casse.

\if :{?section}
\else
  \set section 'provisioning'
\endif

\if :{?section_rollback}
\else
  -- noop
\endif

-- Note: psql `\if` ne supporte pas la comparaison de chaînes en standard.
-- On utilise une variable de contrôle explicite.
-- La méthode la plus simple: passer `-v section=rollback` à psql, puis le DO
-- block ci-dessous lit current_setting('section', true) et agit en conséquence.

DO $$
DECLARE
  v_section text;
BEGIN
  BEGIN
    v_section := current_setting('section', true);
  EXCEPTION WHEN undefined_object THEN
    v_section := 'provisioning';
  END;

  IF v_section = 'rollback' THEN
    RAISE NOTICE '==== ROLLBACK MODE: dropping aspace_observer then aspace_admin ====';

    -- Postgres doc: sql-drop-owned.html — DROP OWNED BY
    -- "Any privileges granted to the given roles on objects in the current database
    --  or on shared objects (databases, tablespaces, configuration parameters)
    --  will also be revoked."
    DROP OWNED BY aspace_observer;
    DROP OWNED BY aspace_admin;

    -- Postgres doc: sql-droprole.html — DROP ROLE [IF EXISTS]
    DROP ROLE IF EXISTS aspace_observer;
    DROP ROLE IF EXISTS aspace_admin;

    RAISE NOTICE '==== ROLLBACK COMPLETE ====';
  ELSE
    RAISE NOTICE '==== PROVISIONING MODE (default) — no rollback performed ====';
  END IF;
END
$$;

-- ============================================================
-- END OF FILE
-- ============================================================
