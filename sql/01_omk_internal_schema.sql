-- ============================================================
-- OMK Dashboard — DDL DRAFT
-- Status: AWAITING ADR-SUPABASE-001 + ADR-OMK-001 ratification
-- Executor: HITL via Codex/Hermes on VPS (after MCP supabase-aspace v0.1)
-- DO NOT EXECUTE in current session — 4 ADR blockers open
-- Date: 2026-06-10
-- ============================================================
--
-- File: 01_omk_internal_schema.sql
-- Schema: omk_internal (staff-only mode, single-tenant)
-- Source of truth: apps/dashboard/REBUILD_WORKFLOW.md §2.1
-- RLS: staff-only (membership role 'omk_staff') — RLS policies defined in 03_rls_policies.sql
--
-- Notes:
-- - Uses gen_random_uuid() from pgcrypto for PKs.
-- - No org_id column (single-tenant staff workspace).
-- - updated_at columns maintained via trigger fn_updated_at().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS omk_internal;
COMMENT ON SCHEMA omk_internal IS 'OMK staff-only dashboard data (single-tenant). RLS = omk_staff role.';

-- ------------------------------------------------------------
-- updated_at trigger function (reused across tables)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION omk_internal.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Table: omk_internal.clients
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_internal.clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  email       text,
  phone       text,
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_clients_status CHECK (status IN ('active','paused','archived','prospect'))
);
CREATE INDEX IF NOT EXISTS idx_clients_status     ON omk_internal.clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON omk_internal.clients (created_at DESC);

DROP TRIGGER IF EXISTS trg_clients_set_updated_at ON omk_internal.clients;
CREATE TRIGGER trg_clients_set_updated_at
  BEFORE UPDATE ON omk_internal.clients
  FOR EACH ROW EXECUTE FUNCTION omk_internal.fn_set_updated_at();

-- ============================================================
-- Table: omk_internal.documents
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_internal.documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL REFERENCES omk_internal.clients(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  file_url     text        NOT NULL,
  mime_type    text        NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_client_id  ON omk_internal.documents (client_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON omk_internal.documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON omk_internal.documents (created_at DESC);

DROP TRIGGER IF EXISTS trg_documents_set_updated_at ON omk_internal.documents;
CREATE TRIGGER trg_documents_set_updated_at
  BEFORE UPDATE ON omk_internal.documents
  FOR EACH ROW EXECUTE FUNCTION omk_internal.fn_set_updated_at();

-- ============================================================
-- Table: omk_internal.agents (staff members / operators)
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_internal.agents (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  role       text        NOT NULL DEFAULT 'operator',
  email      text        UNIQUE,
  status     text        NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_agents_role   CHECK (role   IN ('owner','manager','operator','viewer')),
  CONSTRAINT chk_agents_status CHECK (status IN ('active','paused','archived'))
);
CREATE INDEX IF NOT EXISTS idx_agents_role   ON omk_internal.agents (role);
CREATE INDEX IF NOT EXISTS idx_agents_status ON omk_internal.agents (status);

DROP TRIGGER IF EXISTS trg_agents_set_updated_at ON omk_internal.agents;
CREATE TRIGGER trg_agents_set_updated_at
  BEFORE UPDATE ON omk_internal.agents
  FOR EACH ROW EXECUTE FUNCTION omk_internal.fn_set_updated_at();

-- ============================================================
-- Table: omk_internal.invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_internal.invoices (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid        NOT NULL REFERENCES omk_internal.clients(id) ON DELETE RESTRICT,
  amount     numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency   text        NOT NULL DEFAULT 'EUR',
  status     text        NOT NULL DEFAULT 'draft',
  issued_at  timestamptz,
  due_at     timestamptz,
  paid_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_invoices_status   CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  CONSTRAINT chk_invoices_currency CHECK (char_length(currency) = 3)
);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id  ON omk_internal.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON omk_internal.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_at     ON omk_internal.invoices (due_at);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at  ON omk_internal.invoices (issued_at DESC);

-- ============================================================
-- Table: omk_internal.sops
-- ============================================================
CREATE TABLE IF NOT EXISTS omk_internal.sops (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL,
  content    text        NOT NULL DEFAULT '',
  category   text,
  version    int         NOT NULL DEFAULT 1 CHECK (version > 0),
  status     text        NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_sops_status CHECK (status IN ('draft','published','archived'))
);
CREATE INDEX IF NOT EXISTS idx_sops_category  ON omk_internal.sops (category);
CREATE INDEX IF NOT EXISTS idx_sops_status    ON omk_internal.sops (status);
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON omk_internal.sops (updated_at DESC);

DROP TRIGGER IF EXISTS trg_sops_set_updated_at ON omk_internal.sops;
CREATE TRIGGER trg_sops_set_updated_at
  BEFORE UPDATE ON omk_internal.sops
  FOR EACH ROW EXECUTE FUNCTION omk_internal.fn_set_updated_at();

-- ============================================================
-- Grants (forward-looking — roles not yet created on VPS)
-- ============================================================
-- aspace_admin   = full DDL/DML, bypasses RLS
-- aspace_observer = read-only on non-PII tables (no invoices, no documents file_url? review HITL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aspace_admin') THEN
    GRANT USAGE ON SCHEMA omk_internal TO aspace_admin;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA omk_internal TO aspace_admin;
    GRANT USAGE, SELECT                   ON ALL SEQUENCES IN SCHEMA omk_internal TO aspace_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA omk_internal
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aspace_admin;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aspace_observer') THEN
    GRANT USAGE ON SCHEMA omk_internal TO aspace_observer;
    GRANT SELECT ON omk_internal.clients, omk_internal.agents, omk_internal.sops TO aspace_observer;
    -- intentionally NO SELECT on documents (PII / signed URLs) or invoices (financial PII)
  END IF;
END
$$;
