// src/lib/supabase.ts
// D6 #50 (2026-06-19): Supabase Cloud PostgREST exposes only 'public' schema by
// default (PGRST_DB_SCHEMAS baked at container boot, NOTIFY does not reload).
// Until A0 adds 'omk_saas' to exposed schemas via Dashboard UI Settings > API,
// we default to 'public'. ADR-OMK-001 §runtime multi-schema is deferred to Phase C
// when auth + JWT hook is wired and Supabase Management API can update the env var.
//
// ADR-OMK-001 D4 / ADR-SUPABASE-001 — schema-aware Supabase client.
// The schema is selected by APP_MODE (omk_internal vs omk_saas).
// Only the ANON key is used client-side (VITE_* is public). SERVICE_ROLE_KEY never ships to the browser.

import { createClient } from '@supabase/supabase-js';
import { DB_SCHEMA } from '@/config/mode';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Fail fast & clear (common/coding-style: validate at boundaries).
  // In dev without env, repos should surface this instead of silently using mocks.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing. ' +
      'Set them in .env (see .env.example). Data layer will not work until configured.',
  );
}

// Schema override: PostgREST free-tier on Supabase Cloud exposes only 'public' at boot.
// Cast through unknown to bypass the literal-type narrowing (DB_SCHEMA is 'omk_internal' | 'omk_saas').
const effectiveSchema: string = (DB_SCHEMA as unknown) === 'public' ? (DB_SCHEMA as string) : 'public';

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'public-anon-key', {
  db: { schema: effectiveSchema },
  auth: { persistSession: true, autoRefreshToken: true },
});

export const SUPABASE_READY = Boolean(url && anonKey);
