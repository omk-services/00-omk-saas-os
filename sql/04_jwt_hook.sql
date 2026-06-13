-- ============================================================
-- OMK Dashboard — DDL DRAFT
-- Status: AWAITING ADR-SUPABASE-001 + ADR-OMK-001 ratification
-- Executor: HITL via Codex/Hermes on VPS (after MCP supabase-aspace v0.1)
-- DO NOT EXECUTE in current session — 4 ADR blockers open
-- Date: 2026-06-10
-- ============================================================
--
-- File: 04_jwt_hook.sql
-- Source of truth: Supabase docs — "Custom Access Token Hook"
--   https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
-- Doctrine: this hook is the SINGLE POINT of multi-tenant identity injection.
--           Every saas JWT carries an `org_id` claim sourced from omk_saas.memberships.
--           The RLS policies in 03_rls_policies.sql read that claim to filter rows.
--
-- WIRING (post-deploy, manual in Supabase dashboard or via supabase CLI):
--   1. Apply this SQL on the public schema.
--   2. Supabase Dashboard → Authentication → Hooks → "Custom Access Token"
--      → select public.custom_access_token_hook → Enable.
--   3. Restart supabase-auth (or wait for the auth provider to reload).
--   4. Test: sign in as a saas user, decode the JWT, verify `org_id` claim.
--
-- If the hook is NOT wired, every saas RLS query returns 0 rows silently.
-- This is the "silent failure" risk flagged in OMK/CLAUDE.md gotcha #4.
-- A `console.warn` is required in the client (AuthProvider) when org_id is null
-- in saas mode (see 99_README.md "Verification after execution").

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_claims      jsonb;
  v_user_id     uuid;
  v_org_id      uuid;
  v_role        text;
  v_email       text;
  v_memberships jsonb;
BEGIN
  -- ------------------------------------------------------------------
  -- 1. Extract the user id from the incoming event payload.
  --    Supabase passes: { user_id, session_id, ... }.
  -- ------------------------------------------------------------------
  v_user_id := (event ->> 'user_id')::uuid;

  IF v_user_id IS NULL THEN
    -- Defensive: if the hook is invoked without a user_id, return event unchanged.
    RETURN event;
  END IF;

  -- ------------------------------------------------------------------
  -- 2. Read the user's memberships from omk_saas.
  --    SECURITY DEFINER would be ideal here, but the auth hook runs
  --    as supabase_auth_admin (granted EXECUTE below) and reads
  --    omk_saas.memberships. RLS does NOT apply to supabase_auth_admin
  --    in Supabase default config, but be explicit anyway.
  -- ------------------------------------------------------------------
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'org_id', m.org_id,
      'role',   m.role
    ) ORDER BY m.created_at), '[]'::jsonb)
  INTO v_memberships
  FROM omk_saas.memberships m
  WHERE m.user_id = v_user_id;

  -- ------------------------------------------------------------------
  -- 3. Determine the active org_id.
  --    - If the user has exactly one membership, it's auto-selected.
  --    - If the user has multiple memberships, we read the requested_org
  --      from the event payload (set by the client when switching orgs)
  --      and fall back to the first membership.
  --    - If the user has no memberships (e.g. internal staff), org_id is NULL
  --      and the saas RLS policies will simply return 0 rows.
  -- ------------------------------------------------------------------
  IF jsonb_array_length(v_memberships) = 1 THEN
    v_org_id := (v_memberships -> 0 ->> 'org_id')::uuid;
    v_role   :=  v_memberships -> 0 ->> 'role';
  ELSIF jsonb_array_length(v_memberships) > 1 THEN
    v_org_id := COALESCE(
      NULLIF(event ->> 'requested_org', '')::uuid,
      (v_memberships -> 0 ->> 'org_id')::uuid
    );
    -- Pick the role for the active org, if found.
    SELECT m.role INTO v_role
    FROM omk_saas.memberships m
    WHERE m.user_id = v_user_id AND m.org_id = v_org_id
    LIMIT 1;
  ELSE
    v_org_id := NULL;
    v_role   := NULL;
  END IF;

  -- ------------------------------------------------------------------
  -- 4. Read email from auth.users (for downstream convenience).
  -- ------------------------------------------------------------------
  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  -- ------------------------------------------------------------------
  -- 5. Inject custom claims into the access token.
  --    The Supabase auth server merges these into the JWT's
  --    `app_metadata` (or top-level — we use app_metadata for tenant data
  --    that the client should be able to read).
  -- ------------------------------------------------------------------
  v_claims := event -> 'claims';
  IF v_claims IS NULL THEN
    v_claims := '{}'::jsonb;
  END IF;

  IF v_claims ? 'app_metadata' THEN
    v_claims := jsonb_set(
      v_claims,
      '{app_metadata}',
      (v_claims -> 'app_metadata')
        || jsonb_build_object(
             'org_id',       v_org_id,
             'role',         v_role,
             'memberships',  v_memberships,
             'email',        v_email
           ),
      true
    );
  ELSE
    v_claims := v_claims || jsonb_build_object(
      'app_metadata', jsonb_build_object(
        'org_id',      v_org_id,
        'role',        v_role,
        'memberships', v_memberships,
        'email',       v_email
      )
    );
  END IF;

  -- Also expose org_id at top level so the client can read it cheaply
  -- via auth.jwt() ->> 'org_id' (matches the RLS policies in 03).
  v_claims := jsonb_set(v_claims, '{org_id}', to_jsonb(v_org_id), true);
  v_claims := jsonb_set(v_claims, '{role}',  to_jsonb(v_role),   true);

  event := jsonb_set(event, '{claims}', v_claims, true);

  RETURN event;
END;
$$;

COMMENT ON FUNCTION public.custom_access_token_hook(jsonb) IS
  'Supabase Custom Access Token Hook — injects org_id, role, and memberships from omk_saas.memberships into every JWT. MUST be wired in Supabase Auth dashboard (Authentication → Hooks → Custom Access Token). Without this wiring, saas RLS returns 0 rows silently.';

-- Required Supabase grants (per official docs).
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Lock down — anon and authenticated must never invoke this directly.
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;
