// src/config/mode.ts
// ADR-OMK-001 D1 — Dual-product runtime mode resolution.
// 'internal' = OMK Services own agency ops (schema omk_internal, staff auth)
// 'saas'     = productized multi-tenant for Small Business clients (schema omk_saas, org_id + RLS)
//
// SECURITY (ADR-OMK-001 consequences): the client-side mode is a UI hint only.
// True data isolation is enforced server-side by RLS + JWT claims, never by this flag alone.

export type AppMode = 'internal' | 'saas';

const RAW = (import.meta.env.VITE_APP_MODE ?? 'internal').toString().toLowerCase();

export const APP_MODE: AppMode = RAW === 'saas' ? 'saas' : 'internal';

/** Postgres schema the Supabase client should target for this mode. */
export const DB_SCHEMA = APP_MODE === 'saas' ? 'omk_saas' : 'omk_internal';

export const IS_SAAS = APP_MODE === 'saas';
export const IS_INTERNAL = APP_MODE === 'internal';
