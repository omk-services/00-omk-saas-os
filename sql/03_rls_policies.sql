-- ============================================================
-- OMK Dashboard — DDL DRAFT
-- Status: AWAITING ADR-SUPABASE-001 + ADR-OMK-001 ratification
-- Executor: HITL via Codex/Hermes on VPS (after MCP supabase-aspace v0.1)
-- DO NOT EXECUTE in current session — 4 ADR blockers open
-- Date: 2026-06-10
-- ============================================================
--
-- File: 03_rls_policies.sql
-- Source of truth: apps/dashboard/REBUILD_WORKFLOW.md §2.2 + §4 (RLS tested before any real traffic)
-- Doctrine: every authenticated user sees only their org's rows.
--           service_role bypasses RLS (used by Edge Functions / cron / webhooks).
--
-- Assumes:
--   1. 04_jwt_hook.sql has been applied AND wired in Supabase Auth dashboard
--      (Auth → Hooks → Custom Access Token → select public.custom_access_token_hook).
--   2. auth.jwt() ->> 'org_id' returns the active org UUID for saas users.
--   3. The 'service_role' Postgres role exists (Supabase default).
--   4. The 'authenticated' Postgres role exists (Supabase default).

-- ============================================================
-- Helper: current_org_id() — defensive null-coalesced read of JWT claim
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'org_id', '')::uuid;
$$;
COMMENT ON FUNCTION public.current_org_id() IS 'Defensive read of the org_id JWT claim. Returns NULL if missing/empty.';

GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated, service_role;

-- ============================================================
-- Enable RLS on every saas business table
-- ============================================================
ALTER TABLE omk_saas.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.sops          ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (defense in depth — Supabase docs).
ALTER TABLE omk_saas.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.memberships   FORCE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.clients       FORCE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.documents     FORCE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.agents        FORCE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.invoices      FORCE ROW LEVEL SECURITY;
ALTER TABLE omk_saas.sops          FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Tenant isolation policies (per-table: SELECT / INSERT / UPDATE / DELETE)
-- Pattern follows Supabase RLS Performance Advisors — wrap auth.jwt() in SELECT.
-- ============================================================

-- ---------- clients ----------
DROP POLICY IF EXISTS tenant_isolation_select  ON omk_saas.clients;
DROP POLICY IF EXISTS tenant_isolation_insert  ON omk_saas.clients;
DROP POLICY IF EXISTS tenant_isolation_update  ON omk_saas.clients;
DROP POLICY IF EXISTS tenant_isolation_delete  ON omk_saas.clients;
DROP POLICY IF EXISTS service_role_all         ON omk_saas.clients;

CREATE POLICY tenant_isolation_select ON omk_saas.clients
  FOR SELECT TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_insert ON omk_saas.clients
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_update ON omk_saas.clients
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT current_org_id()))
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_delete ON omk_saas.clients
  FOR DELETE TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY service_role_all ON omk_saas.clients
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------- documents ----------
DROP POLICY IF EXISTS tenant_isolation_select  ON omk_saas.documents;
DROP POLICY IF EXISTS tenant_isolation_insert  ON omk_saas.documents;
DROP POLICY IF EXISTS tenant_isolation_update  ON omk_saas.documents;
DROP POLICY IF EXISTS tenant_isolation_delete  ON omk_saas.documents;
DROP POLICY IF EXISTS service_role_all         ON omk_saas.documents;

CREATE POLICY tenant_isolation_select ON omk_saas.documents
  FOR SELECT TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_insert ON omk_saas.documents
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_update ON omk_saas.documents
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT current_org_id()))
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_delete ON omk_saas.documents
  FOR DELETE TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY service_role_all ON omk_saas.documents
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------- agents ----------
DROP POLICY IF EXISTS tenant_isolation_select  ON omk_saas.agents;
DROP POLICY IF EXISTS tenant_isolation_insert  ON omk_saas.agents;
DROP POLICY IF EXISTS tenant_isolation_update  ON omk_saas.agents;
DROP POLICY IF EXISTS tenant_isolation_delete  ON omk_saas.agents;
DROP POLICY IF EXISTS service_role_all         ON omk_saas.agents;

CREATE POLICY tenant_isolation_select ON omk_saas.agents
  FOR SELECT TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_insert ON omk_saas.agents
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_update ON omk_saas.agents
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT current_org_id()))
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_delete ON omk_saas.agents
  FOR DELETE TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY service_role_all ON omk_saas.agents
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------- invoices ----------
DROP POLICY IF EXISTS tenant_isolation_select  ON omk_saas.invoices;
DROP POLICY IF EXISTS tenant_isolation_insert  ON omk_saas.invoices;
DROP POLICY IF EXISTS tenant_isolation_update  ON omk_saas.invoices;
DROP POLICY IF EXISTS tenant_isolation_delete  ON omk_saas.invoices;
DROP POLICY IF EXISTS service_role_all         ON omk_saas.invoices;

CREATE POLICY tenant_isolation_select ON omk_saas.invoices
  FOR SELECT TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_insert ON omk_saas.invoices
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_update ON omk_saas.invoices
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT current_org_id()))
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_delete ON omk_saas.invoices
  FOR DELETE TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY service_role_all ON omk_saas.invoices
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------- sops ----------
DROP POLICY IF EXISTS tenant_isolation_select  ON omk_saas.sops;
DROP POLICY IF EXISTS tenant_isolation_insert  ON omk_saas.sops;
DROP POLICY IF EXISTS tenant_isolation_update  ON omk_saas.sops;
DROP POLICY IF EXISTS tenant_isolation_delete  ON omk_saas.sops;
DROP POLICY IF EXISTS service_role_all         ON omk_saas.sops;

CREATE POLICY tenant_isolation_select ON omk_saas.sops
  FOR SELECT TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_insert ON omk_saas.sops
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_update ON omk_saas.sops
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT current_org_id()))
  WITH CHECK (org_id = (SELECT current_org_id()));

CREATE POLICY tenant_isolation_delete ON omk_saas.sops
  FOR DELETE TO authenticated
  USING (org_id = (SELECT current_org_id()));

CREATE POLICY service_role_all ON omk_saas.sops
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- organizations: a user can SELECT organizations where they have a membership
-- Writes are restricted to service_role (org creation is service-side).
-- ============================================================
DROP POLICY IF EXISTS org_member_select ON omk_saas.organizations;
DROP POLICY IF EXISTS service_role_all  ON omk_saas.organizations;

CREATE POLICY org_member_select ON omk_saas.organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM omk_saas.memberships m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY service_role_all ON omk_saas.organizations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- memberships: a user can SELECT their own memberships
-- Writes are restricted to service_role (member provisioning is service-side).
-- ============================================================
DROP POLICY IF EXISTS self_membership_select ON omk_saas.memberships;
DROP POLICY IF EXISTS service_role_all       ON omk_saas.memberships;

CREATE POLICY self_membership_select ON omk_saas.memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY service_role_all ON omk_saas.memberships
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
