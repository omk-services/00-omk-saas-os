// src/lib/tenant.ts
// ADR-OMK-005 (Phase C) — tenant isolation guard at the application layer.
//
// PURPOSE
//   The RLS policies in `omk_saas.*` filter rows server-side based on the
//   `org_id` claim injected by `public.custom_access_token_hook`. This module
//   adds a CLIENT-SIDE guard so that:
//     1. Every repository call receives the active org_id (defense-in-depth).
//     2. UI components can display tenant context (org name, user role).
//     3. A clear runtime error fires if org_id is missing in saas mode
//        (catches the silent-failure mode flagged in omk/AGENTS.md gotcha #4).
//
// USAGE
//   import { useOrg } from '@/lib/tenant';
//   const { orgId, orgName, role, isReady, isMissing } = useOrg();
//   if (isMissing) return <NoOrgBanner />;
//   const { data } = await supabase.from('clients').select('*').eq('org_id', orgId);
//
// CONNECTION TO SUPABASE AUTH
//   We do NOT call supabase.auth.getSession() here — that's AuthProvider's job.
//   This module is a pure consumer of AuthContext. The Repos in src/data/*.repo.ts
//   can either read useOrg() (React) or call getActiveOrgId() (non-React code).

import { useContext } from 'react';
import { AuthContext } from '@/auth/AuthProvider';
import { IS_SAAS } from '@/config/mode';

export interface TenantContext {
  /** Active org UUID. NULL = user has no membership (or not signed in). */
  orgId: string | null;
  /** Active org display name (fetched by AuthProvider, may be null during hydration). */
  orgName: string | null;
  /** Active role (owner / admin / member / viewer). Defaults to 'authenticated' if no claim. */
  role: string;
  /** User has an authenticated session. */
  isAuthenticated: boolean;
  /** Hydration done: we know whether orgId is set or not. */
  isReady: boolean;
  /** saas mode AND orgId is missing. UI should show a NoOrgBanner. */
  isMissing: boolean;
}

/**
 * React hook: read the active tenant context.
 * Returns a stable shape so components can destructure without nil checks.
 */
export function useOrg(): TenantContext {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // AuthProvider not mounted — fail loud in dev, fail silent in prod.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[tenant] useOrg() called outside <AuthProvider>.');
    }
    return {
      orgId: null,
      orgName: null,
      role: 'anonymous',
      isAuthenticated: false,
      isReady: false,
      isMissing: IS_SAAS,
    };
  }

  const { user, organization, isLoading } = ctx;
  const isReady = !isLoading;
  const orgId = user?.orgId ?? null;
  const orgName = organization?.name ?? null;
  const role = user?.role ?? 'authenticated';
  const isMissing = IS_SAAS && isReady && orgId === null;

  if (isMissing && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      '[tenant] saas mode but orgId is NULL. RLS will return 0 rows. ' +
        'Check that auth hook `public.custom_access_token_hook` is wired in ' +
        'Supabase Auth dashboard and that the user has a row in omk_saas.memberships.',
    );
  }

  return { orgId, orgName, role, isAuthenticated: !!user, isReady, isMissing };
}

/**
 * Non-React accessor: get the current orgId from the auth context.
 * Returns null if no AuthContext is mounted.
 * Use this in repos that are called from non-React code (event handlers, etc.).
 */
export function getActiveOrgId(): string | null {
  // We can't call useContext outside a component, so we rely on a global cache
  // updated by AuthProvider on every auth state change. See `setActiveOrgIdCache`.
  return _activeOrgIdCache;
}

let _activeOrgIdCache: string | null = null;
export function setActiveOrgIdCache(orgId: string | null): void {
  _activeOrgIdCache = orgId;
}

/**
 * Throws if invoked in saas mode without an orgId.
 * Use in repos before any .insert() / .update() / .delete() to fail fast
 * rather than let RLS return 0 rows silently.
 */
export function assertOrgIdForWrite(orgId: string | null, table: string): asserts orgId is string {
  if (IS_SAAS && !orgId) {
    throw new Error(
      `[${table}] Cannot write in saas mode without an active orgId. ` +
        'Check that the user is signed in AND has a row in omk_saas.memberships.',
    );
  }
}
