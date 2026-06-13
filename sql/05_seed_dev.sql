-- ============================================================
-- OMK Dashboard — DDL DRAFT
-- Status: AWAITING ADR-SUPABASE-001 + ADR-OMK-001 ratification
-- Executor: HITL via Codex/Hermes on VPS (after MCP supabase-aspace v0.1)
-- DO NOT EXECUTE in current session — 4 ADR blockers open
-- Date: 2026-06-10
-- ============================================================
--
-- DEV SEED ONLY — DO NOT RUN IN PROD
--
-- File: 05_seed_dev.sql
-- Purpose: provide a minimal, repeatable dataset for local dev / E2E / Phase H RLS tests.
--          Seeds 1 test org + 1 test membership + 3-5 rows in each business table.
--
-- HOW TO USE:
--   1. Replace the placeholder user UUID below (v_test_user_id) with a real
--      auth.users.id (sign up via supabase auth.signUp() then copy the id,
--      or INSERT into auth.users manually with a known password).
--   2. Run AFTER 01+02+03+04 have been applied.
--   3. Run as a role that can write to omk_saas (service_role recommended).
--   4. To reset: DELETE FROM omk_saas.organizations WHERE slug = 'acme-demo';
--
-- SAFETY: the WHERE NOT EXISTS guard makes this idempotent. Re-running is safe.

BEGIN;

-- ------------------------------------------------------------------
-- Test organization
-- ------------------------------------------------------------------
INSERT INTO omk_saas.organizations (id, name, slug, plan, status)
SELECT '00000000-0000-0000-0000-000000000a01'::uuid,
       'Acme Demo SARL',
       'acme-demo',
       'starter',
       'active'
WHERE NOT EXISTS (
  SELECT 1 FROM omk_saas.organizations WHERE slug = 'acme-demo'
);

-- ------------------------------------------------------------------
-- Test user UUID (REPLACE WITH A REAL auth.users.id BEFORE RUNNING).
-- Steps to get a real id:
--   a) Run the dashboard in dev, sign up via the supabase client.
--   b) SELECT id, email FROM auth.users WHERE email = 'dev+omk@example.com';
--   c) Paste the id below.
-- ------------------------------------------------------------------
DO $$
DECLARE
  v_test_user_id  uuid := '00000000-0000-0000-0000-000000000b01'::uuid; -- <<< REPLACE
  v_test_org_id   uuid := '00000000-0000-0000-0000-000000000a01'::uuid;
BEGIN
  -- Membership: link test user to test org as 'owner'.
  INSERT INTO omk_saas.memberships (user_id, org_id, role)
  SELECT v_test_user_id, v_test_org_id, 'owner'
  WHERE NOT EXISTS (
    SELECT 1 FROM omk_saas.memberships
    WHERE user_id = v_test_user_id AND org_id = v_test_org_id
  );

  -- If the user doesn't exist in auth.users yet, warn (don't insert — auth.users is managed by Supabase Auth).
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_test_user_id) THEN
    RAISE NOTICE 'Seed warning: user % does not exist in auth.users. Membership row was created but the JWT hook will not return an org_id until the user signs up.', v_test_user_id;
  END IF;
END
$$;

-- ------------------------------------------------------------------
-- Clients (5 rows) for the test org
-- ------------------------------------------------------------------
INSERT INTO omk_saas.clients (org_id, name, email, phone, service, status, progress)
SELECT v.org_id, v.name, v.email, v.phone, v.service, v.status, v.progress
FROM (VALUES
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Boulangerie Martin',  'contact@boulangerie-martin.fr',  '+33 1 23 45 67 89', 'comptabilite',    'active',  80),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Coiffure Étoile',    'hello@coiffure-etoile.fr',      '+33 1 98 76 54 32', 'paie',           'active',  45),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Atelier Bricolage',  'info@atelier-bricolage.fr',     '+33 1 11 22 33 44', 'juridique',      'paused',  20),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Restaurant Le Sud',  'gerant@lesud.fr',               '+33 1 55 66 77 88', 'comptabilite',   'active',  100),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Startup Nova',       'founder@nova.io',               '+33 1 99 88 77 66', 'full-service',   'prospect',10)
) AS v(org_id, name, email, phone, service, status, progress)
WHERE NOT EXISTS (
  SELECT 1 FROM omk_saas.clients c
  WHERE c.org_id = v.org_id AND c.email = v.email
);

-- ------------------------------------------------------------------
-- Documents (3 rows)
-- ------------------------------------------------------------------
INSERT INTO omk_saas.documents (org_id, client_id, title, file_url, mime_type, uploaded_by)
SELECT '00000000-0000-0000-0000-000000000a01'::uuid,
       c.id,
       'KBIS 2026 - ' || c.name,
       'https://example.com/seed/kbis-' || c.id || '.pdf',
       'application/pdf',
       '00000000-0000-0000-0000-000000000b01'::uuid
FROM omk_saas.clients c
WHERE c.org_id = '00000000-0000-0000-0000-000000000a01'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM omk_saas.documents d
    WHERE d.client_id = c.id AND d.title LIKE 'KBIS 2026 - %'
  )
LIMIT 3;

-- ------------------------------------------------------------------
-- Agents (2 rows)
-- ------------------------------------------------------------------
INSERT INTO omk_saas.agents (org_id, name, role, email, status)
SELECT v.org_id, v.name, v.role, v.email, v.status
FROM (VALUES
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Alice Martin',  'manager',  'alice@acme-demo.fr',  'active'),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Bob Dupont',    'operator', 'bob@acme-demo.fr',    'active')
) AS v(org_id, name, role, email, status)
WHERE NOT EXISTS (
  SELECT 1 FROM omk_saas.agents a
  WHERE a.org_id = v.org_id AND a.email = v.email
);

-- ------------------------------------------------------------------
-- Invoices (4 rows)
-- ------------------------------------------------------------------
INSERT INTO omk_saas.invoices (org_id, client_id, amount, currency, status, issued_at, due_at, paid_at)
SELECT v.org_id, c.id, v.amount, v.currency, v.status, v.issued_at, v.due_at, v.paid_at
FROM (VALUES
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Boulangerie Martin', 1200.00, 'EUR', 'paid',    now() - interval '60 days', now() - interval '30 days', now() - interval '35 days'),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Coiffure Étoile',     650.00, 'EUR', 'sent',    now() - interval '20 days', now() + interval '10 days', NULL),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Restaurant Le Sud',  2400.00, 'EUR', 'overdue', now() - interval '90 days', now() - interval '60 days', NULL),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Atelier Bricolage',   400.00, 'EUR', 'draft',   NULL,                         NULL,                            NULL)
) AS v(org_id, client_name, amount, currency, status, issued_at, due_at, paid_at)
JOIN omk_saas.clients c
  ON c.org_id = v.org_id AND c.name = v.client_name
WHERE NOT EXISTS (
  SELECT 1 FROM omk_saas.invoices i
  WHERE i.org_id = v.org_id AND i.client_id = c.id AND i.amount = v.amount
);

-- ------------------------------------------------------------------
-- SOPs (3 rows)
-- ------------------------------------------------------------------
INSERT INTO omk_saas.sops (org_id, title, content, category, version, status)
SELECT v.org_id, v.title, v.content, v.category, v.version, v.status
FROM (VALUES
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Onboarding client',           'Étape 1: KBIS. Étape 2: RIB. Étape 3: contrat signé.',         'onboarding', 1, 'published'),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Clôture mensuelle',           '1) Pointer relevés bancaires. 2) Lettrer. 3) Export FEC.',       'comptabilite', 2, 'published'),
  ('00000000-0000-0000-0000-000000000a01'::uuid, 'Gestion impayés',             'Relance 1 à J+7, relance 2 à J+15, contentieux à J+45.',       'finance', 1, 'draft')
) AS v(org_id, title, content, category, version, status)
WHERE NOT EXISTS (
  SELECT 1 FROM omk_saas.sops s
  WHERE s.org_id = v.org_id AND s.title = v.title
);

COMMIT;

-- Quick read-back summary (do not assert; just for the operator's eyes).
DO $$
DECLARE
  v_org_count      int;
  v_membership_cnt int;
  v_client_cnt     int;
  v_doc_cnt        int;
  v_agent_cnt      int;
  v_invoice_cnt    int;
  v_sop_cnt        int;
BEGIN
  SELECT count(*) INTO v_org_count      FROM omk_saas.organizations;
  SELECT count(*) INTO v_membership_cnt FROM omk_saas.memberships;
  SELECT count(*) INTO v_client_cnt     FROM omk_saas.clients;
  SELECT count(*) INTO v_doc_cnt        FROM omk_saas.documents;
  SELECT count(*) INTO v_agent_cnt      FROM omk_saas.agents;
  SELECT count(*) INTO v_invoice_cnt    FROM omk_saas.invoices;
  SELECT count(*) INTO v_sop_cnt        FROM omk_saas.sops;
  RAISE NOTICE 'Seed summary → orgs=%, memberships=%, clients=%, documents=%, agents=%, invoices=%, sops=%',
    v_org_count, v_membership_cnt, v_client_cnt, v_doc_cnt, v_agent_cnt, v_invoice_cnt, v_sop_cnt;
END
$$;
