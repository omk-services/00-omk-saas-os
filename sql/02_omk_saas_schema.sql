-- ============================================================
-- OMK Dashboard — DDL DRAFT
-- Status: AWAITING ADR-SUPABASE-001 + ADR-OMK-001 ratification
-- Executor: HITL via Codex/Hermes on VPS (after MCP supabase-aspace v0.1)
-- DO NOT EXECUTE in current session — 4 ADR blockers open
-- Date: 2026-06-10
-- ============================================================
--
-- File: 02_omk_saas_schema.sql
-- Schema: omk_saas (multi-tenant PME mode)
-- Source of truth: apps/dashboard/REBUILD_WORKFLOW.md §2.2
-- RLS: per org_id from custom JWT claim — policies defined in 03_rls_policies.sql
--
-- Notes:
-- - Every business table carries org_id NOT NULL → omk_saas.organizations(id).
-- - Indexes on org_id are CRITICAL for RLS perf (Supabase docs).
-- - Composite uniqueness on (org_id, email) for clients and agents to prevent
--   cross-tenant collisions on a per-tenant basis.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS omk_saas;
COMMENT ON SCHEMA omk_saas IS 'OMK SaaS dashboard data (multi-tenant). RLS = org_id JWT claim.';

-- ------------------------------------------------------------
-- updated_at trigger function (reused across tables)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION omk_saas.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Table: omk_saas.organizations
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_saas.organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  plan        text        NOT NULL DEFAULT 'starter',
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_organizations_plan   CHECK (plan   IN ('starter','growth','enterprise')),
  CONSTRAINT chk_organizations_status CHECK (status IN ('active','paused','archived')),
  CONSTRAINT chk_organizations_slug   CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$')
);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON omk_saas.organizations (status);

DROP TRIGGER IF EXISTS trg_organizations_set_updated_at ON omk_saas.organizations;
CREATE TRIGGER trg_organizations_set_updated_at
  BEFORE UPDATE ON omk_saas.organizations
  FOR EACH ROW EXECUTE FUNCTION omk_saas.fn_set_updated_at();

-- ============================================================
-- Table: omk_saas.memberships (auth.users ↔ organizations)
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_saas.memberships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,
  org_id      uuid        NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'member',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_memberships_user_org UNIQUE (user_id, org_id),
  CONSTRAINT chk_memberships_role   CHECK (role IN ('owner','admin','member','viewer'))
);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id  ON omk_saas.memberships (org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON omk_saas.memberships (user_id);

DROP TRIGGER IF EXISTS trg_memberships_set_updated_at ON omk_saas.memberships;
CREATE TRIGGER trg_memberships_set_updated_at
  BEFORE UPDATE ON omk_saas.memberships
  FOR EACH ROW EXECUTE FUNCTION omk_saas.fn_set_updated_at();

-- ============================================================
-- Table: omk_saas.clients
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_saas.clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  email       text,
  phone       text,
  service     text,
  status      text        NOT NULL DEFAULT 'active',
  progress    int         NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_saas_clients_status CHECK (status IN ('active','paused','archived','prospect'))
);
CREATE INDEX IF NOT EXISTS idx_saas_clients_org_id     ON omk_saas.clients (org_id);
CREATE INDEX IF NOT EXISTS idx_saas_clients_org_status ON omk_saas.clients (org_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_clients_email      ON omk_saas.clients (org_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_saas_clients_org_email ON omk_saas.clients (org_id, email) WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS trg_saas_clients_set_updated_at ON omk_saas.clients;
CREATE TRIGGER trg_saas_clients_set_updated_at
  BEFORE UPDATE ON omk_saas.clients
  FOR EACH ROW EXECUTE FUNCTION omk_saas.fn_set_updated_at();

-- ============================================================
-- Table: omk_saas.documents
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_saas.documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid        NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  client_id    uuid        NOT NULL REFERENCES omk_saas.clients(id)      ON DELETE CASCADE,
  title        text        NOT NULL,
  file_url     text        NOT NULL,
  mime_type    text        NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saas_documents_org_id    ON omk_saas.documents (org_id);
CREATE INDEX IF NOT EXISTS idx_saas_documents_client_id ON omk_saas.documents (client_id);
CREATE INDEX IF NOT EXISTS idx_saas_documents_uploaded  ON omk_saas.documents (org_id, uploaded_by);
CREATE INDEX IF NOT EXISTS idx_saas_documents_created   ON omk_saas.documents (created_at DESC);

DROP TRIGGER IF EXISTS trg_saas_documents_set_updated_at ON omk_saas.documents;
CREATE TRIGGER trg_saas_documents_set_updated_at
  BEFORE UPDATE ON omk_saas.documents
  FOR EACH ROW EXECUTE FUNCTION omk_saas.fn_set_updated_at();

-- ============================================================
-- Table: omk_saas.agents (tenant-scoped staff/operators)
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_saas.agents (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  role       text        NOT NULL DEFAULT 'operator',
  email      text,
  status     text        NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_saas_agents_role   CHECK (role   IN ('owner','manager','operator','viewer')),
  CONSTRAINT chk_saas_agents_status CHECK (status IN ('active','paused','archived'))
);
CREATE INDEX IF NOT EXISTS idx_saas_agents_org_id     ON omk_saas.agents (org_id);
CREATE INDEX IF NOT EXISTS idx_saas_agents_org_role  ON omk_saas.agents (org_id, role);
CREATE INDEX IF NOT EXISTS idx_saas_agents_org_email ON omk_saas.agents (org_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_saas_agents_org_email ON omk_saas.agents (org_id, email) WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS trg_saas_agents_set_updated_at ON omk_saas.agents;
CREATE TRIGGER trg_saas_agents_set_updated_at
  BEFORE UPDATE ON omk_saas.agents
  FOR EACH ROW EXECUTE FUNCTION omk_saas.fn_set_updated_at();

-- ============================================================
-- Table: omk_saas.invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_saas.invoices (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid           NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  client_id  uuid           NOT NULL REFERENCES omk_saas.clients(id)      ON DELETE RESTRICT,
  amount     numeric(12,2)  NOT NULL CHECK (amount >= 0),
  currency   text           NOT NULL DEFAULT 'EUR',
  status     text           NOT NULL DEFAULT 'draft',
  issued_at  timestamptz,
  due_at     timestamptz,
  paid_at    timestamptz,
  created_at timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT chk_saas_invoices_status   CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  CONSTRAINT chk_saas_invoices_currency CHECK (char_length(currency) = 3)
);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_org_id    ON omk_saas.invoices (org_id);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_client_id ON omk_saas.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_org_status ON omk_saas.invoices (org_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_due_at    ON omk_saas.invoices (due_at);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_issued_at ON omk_saas.invoices (issued_at DESC);

-- ============================================================
-- Table: omk_saas.sops
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_saas.sops (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  content    text        NOT NULL DEFAULT '',
  category   text,
  version    int         NOT NULL DEFAULT 1 CHECK (version > 0),
  status     text        NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_saas_sops_status CHECK (status IN ('draft','published','archived'))
);
CREATE INDEX IF NOT EXISTS idx_saas_sops_org_id      ON omk_saas.sops (org_id);
CREATE INDEX IF NOT EXISTS idx_saas_sops_org_status  ON omk_saas.sops (org_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_sops_category    ON omk_saas.sops (org_id, category);
CREATE INDEX IF NOT EXISTS idx_saas_sops_updated_at  ON omk_saas.sops (updated_at DESC);

DROP TRIGGER IF EXISTS trg_saas_sops_set_updated_at ON omk_saas.sops;
CREATE TRIGGER trg_saas_sops_set_updated_at
  BEFORE UPDATE ON omk_saas.sops
  FOR EACH ROW EXECUTE FUNCTION omk_saas.fn_set_updated_at();

-- ============================================================
-- Grants (forward-looking — roles not yet created on VPS)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aspace_admin') THEN
    GRANT USAGE ON SCHEMA omk_saas TO aspace_admin;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA omk_saas TO aspace_admin;
    GRANT USAGE, SELECT                   ON ALL SEQUENCES IN SCHEMA omk_saas TO aspace_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA omk_saas
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aspace_admin;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aspace_observer') THEN
    GRANT USAGE ON SCHEMA omk_saas TO aspace_observer;
    -- Observer sees only org/sop metadata, no PII (no client email/phone, no documents, no invoices)
    GRANT SELECT ON
      omk_saas.organizations,
      omk_saas.sops
    TO aspace_observer;
  END IF;
END
$$;
