// src/lib/supabase.ts
// ADR-OMK-004 RATIFIED 2026-06-19 — single SaaS mode on Supabase Cloud.
// PostgREST is configured (via Dashboard UI Settings > API > Exposed schemas)
// to serve BOTH 'public' and 'omk_saas' schemas. The PGRST_DB_SCHEMAS env var
// is set on the Supabase project to: 'public,omk_saas'.
//
// D6 #64 (2026-06-20): Previously the schema was hardcoded to 'public' because
// PGRST_DB_SCHEMAS didn't expose 'omk_saas'. Now that the auth hook wiring runbook
// is done (Phase B), the Dashboard UI change is the only remaining step. After
// the A0 action in `docs/runbooks/2026-06-20-phase-b-auth-hook-wiring.md`,
// this file should be re-deployed.
//
// ADR-OMK-001 D4 / ADR-SUPABASE-001 — schema-aware Supabase client.
// The schema is selected by APP_MODE (omk_internal vs omk_saas). After
// ADR-OMK-004, only 'omk_saas' is used in production ('omk_internal' RETIRED).
// Only the ANON key is used client-side (VITE_* is public). SERVICE_ROLE_KEY
// never ships to the browser.

import { createClient } from '@supabase/supabase-js';
import { DB_SCHEMA } from '@/config/mode';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Fail fast & clear (common/coding-style: validate at boundaries).
  // In dev without env, repos should surface this instead of silently using mocks.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing. ' +
        'Set them in .env (see .env.example). Data layer will not work until configured.',
    );
  }
}

// Schema target by APP_MODE. After ADR-OMK-004, this is always 'omk_saas'.
// We always set the schema to the active APP_MODE schema (was hardcoded to
// 'public' before the Phase A migration per D6 #50/D6 #64).
const effectiveSchema: string = DB_SCHEMA as string;

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'public-anon-key', {
  db: { schema: effectiveSchema },
  auth: { persistSession: true, autoRefreshToken: true },
});

export const SUPABASE_READY = Boolean(url && anonKey);

/**
 * Convenience: explicit schema-typed table accessor.
 * Use `fromSchema('clients')` instead of `from('clients')` to make the
 * target schema unambiguous at the call site (avoids D6 #50 foot-gun).
 */
export function fromSchema<T = unknown>(table: string) {
  return supabase.from(table) as unknown as {
    select: (cols?: string) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
  };
}
