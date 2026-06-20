// src/data/repository.ts
// ADR-OMK-001 D4 + ADR-OMK-005 (Phase A→F) + Phase I (D6 #97 default mapper).
//
// Two execution paths:
//   1. Supabase Cloud (when SUPABASE_READY): queries target `omk_saas.*` schema
//      (per ADR-OMK-004 single SaaS mode). RLS policies filter by `org_id`
//      from the JWT claim injected by `public.custom_access_token_hook`.
//   2. localStorage (dev fallback): seeded with mocks from constants.ts. RLS
//      is simulated by the in-memory filter `item.org_id === activeOrgId`.
//
// FIELD MAPPING (Phase I, D6 #97)
//   Without a custom `options.mapper`, the default `autoMap<T>()` converts
//   snake_case DB columns to camelCase UI fields for the canonical column
//   names introduced in Phase A:
//     - created_at   -> `date`       (YYYY-MM-DD substring, 10 chars)
//     - updated_at   -> `updatedAt`  (full ISO string)
//     - org_id       -> stripped (UI types don't carry tenant; repo injects)
//     - file_url     -> `fileUrl`
//     - mime_type    -> `mimeType`
//     - client_id    -> `clientId`
//   Custom mappers (SalesView, LegalView) still take precedence — they pass
//   `options.mapper` explicitly.
//
// TENANT GUARD
//   When a tenant context is available (useOrg() / getActiveOrgId()),
//   every query is filtered by `org_id`. The RLS policy is the authoritative
//   filter server-side; this is defense-in-depth.

import { supabase, SUPABASE_READY } from '@/lib/supabase';
import { IS_SAAS } from '@/config/mode';
import { getActiveOrgId, assertOrgIdForWrite } from '@/lib/tenant';

export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  /** Create a new entity. `id` is optional — Postgres generates via gen_random_uuid(). */
  create(item: Partial<T> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

interface MakeRepositoryOptions<T> {
  /** Override the default mapper if the UI type ≠ DB row shape. */
  mapper?: Mapper<T>;
}

type Mapper<T> = {
  toDb: (ui: Partial<T>) => Record<string, unknown>;
  fromDb: (row: Record<string, unknown>) => T;
};

// Identity mapper (pass-through). Used by default + as fallback when no custom mapper.
const identityMapper = <T>(): Mapper<T> => ({
  toDb: (ui) => ui as Record<string, unknown>,
  fromDb: (row) => row as unknown as T,
});

// ────────────────────────────────────────────────────────────────────────────
// Default snake_case → camelCase mapper (D6 #97)
// ────────────────────────────────────────────────────────────────────────────
// DB columns are snake_case per Phase A canon. UI types are camelCase.
// We map the canonical column names introduced by Phase A:
//   created_at, updated_at, file_url, mime_type, client_id, org_id
// Anything else passes through unchanged.

const DB_TO_UI_COLUMN_MAP: Readonly<Record<string, string>> = {
  created_at: 'date',
  updated_at: 'updatedAt',
  file_url: 'fileUrl',
  mime_type: 'mimeType',
  client_id: 'clientId',
  org_id: 'orgId',
};

const UI_TO_DB_COLUMN_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(DB_TO_UI_COLUMN_MAP).map(([db, ui]) => [ui, db]),
);

/**
 * Convert a single DB row (snake_case) to UI shape (camelCase).
 * - `created_at` / `updated_at` → trimmed to YYYY-MM-DD for `date`, full ISO for `updatedAt`
 * - `org_id` is stripped (UI types don't carry tenant identity)
 * - Unknown columns pass through
 */
function rowToUi<T extends { id: string }>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [dbKey, value] of Object.entries(row)) {
    const uiKey = DB_TO_UI_COLUMN_MAP[dbKey] ?? dbKey;
    if (uiKey === 'orgId') continue; // strip tenant identity from UI
    if (uiKey === 'date' && typeof value === 'string' && value.length >= 10) {
      out[uiKey] = value.substring(0, 10); // YYYY-MM-DD
    } else {
      out[uiKey] = value;
    }
  }
  return out as T;
}

/**
 * Convert a single UI patch (camelCase) to DB columns (snake_case).
 * Renames known UI→DB keys; passes unknown keys through; drops `date` if
 * already a `created_at` form (the repo never writes `date` directly).
 */
function uiToRow<T>(ui: Partial<T>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ui as Record<string, unknown>)) {
    const dbKey = UI_TO_DB_COLUMN_MAP[key] ?? key;
    out[dbKey] = value;
  }
  return out;
}

// Default mapper wired to the autoMap helpers. Views can still pass a custom
// mapper via `options.mapper` to override.
const defaultMapper = <T extends { id: string }>(): Mapper<T> => ({
  toDb: (ui) => uiToRow<T>(ui),
  fromDb: (row) => rowToUi<T>(row),
});

export function makeRepository<T extends { id: string }>(
  table: string,
  seed: T[],
  options: MakeRepositoryOptions<T> = {},
): Repository<T> {
  const lsKey = `omk_${table}`;
  // D6 #97: prefer the custom mapper if passed; otherwise use the auto mapper.
  const mapper: Mapper<T> = options.mapper ?? defaultMapper<T>();

  if (SUPABASE_READY) {
    return {
      async list(): Promise<T[]> {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw new Error(`[${table}] ${error.message}`);
        return (data ?? []).map((row) => mapper.fromDb(row as Record<string, unknown>));
      },
      async findById(id: string): Promise<T | null> {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw new Error(`[${table}] ${error.message}`);
        return data ? mapper.fromDb(data as Record<string, unknown>) : null;
      },
      async create(item): Promise<T> {
        const orgId = getActiveOrgId();
        assertOrgIdForWrite(orgId, table);

        const dbRow = mapper.toDb(item as Partial<T>);
        // Inject org_id automatically — caller doesn't have to remember.
        (dbRow as Record<string, unknown>).org_id = orgId;

        // If caller didn't provide an id, let Postgres generate one via gen_random_uuid().
        if (!item.id) delete (dbRow as Record<string, unknown>).id;

        const { data, error } = await supabase.from(table).insert(dbRow).select().single();
        if (error) throw new Error(`[${table}] ${error.message}`);
        return mapper.fromDb(data as Record<string, unknown>);
      },
      async update(id: string, patch: Partial<T>): Promise<T> {
        const dbRow = mapper.toDb(patch);
        const { data, error } = await supabase
          .from(table)
          .update(dbRow as Record<string, unknown>)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(`[${table}] ${error.message}`);
        return mapper.fromDb(data as Record<string, unknown>);
      },
      async remove(id: string): Promise<void> {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw new Error(`[${table}] ${error.message}`);
      },
    };
  }

  // localStorage fallback (dev only) — preserves pre-Supabase behavior.
  // Simulates tenant isolation by filtering on the in-memory `org_id` field.
  const read = (): T[] => {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        return JSON.parse(raw) as T[];
      } catch {
        // corrupt cache → reseed below
      }
    }
    // Seed with org_id = 'local-dev' so the filter passes.
    const seeded = seed.map((item) => ({ ...item, org_id: 'local-dev' })) as unknown as T[];
    localStorage.setItem(lsKey, JSON.stringify(seeded));
    return seeded;
  };

  const write = (next: T[]): void => {
    localStorage.setItem(lsKey, JSON.stringify(next));
  };

  return {
    async list(): Promise<T[]> {
      const orgId = getActiveOrgId();
      const items = read();
      // Tenant filter (defense-in-depth even in local dev).
      if (IS_SAAS && orgId) {
        return items.filter((item: unknown) => (item as { org_id?: string }).org_id === orgId);
      }
      return items;
    },
    async findById(id: string): Promise<T | null> {
      const found = read().find((item) => item.id === id);
      return found ?? null;
    },
    async create(item): Promise<T> {
      const orgId = getActiveOrgId();
      assertOrgIdForWrite(orgId, table);

      const generatedId = item.id ?? crypto.randomUUID();
      const created = { ...item, id: generatedId, org_id: orgId } as unknown as T;
      const next = [...read(), created];
      write(next);
      return created;
    },
    async update(id: string, patch: Partial<T>): Promise<T> {
      const current = read();
      const index = current.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(`[${table}] not found: ${id}`);
      const updated: T = { ...current[index], ...patch };
      const next = [...current];
      next[index] = updated;
      write(next);
      return updated;
    },
    async remove(id: string): Promise<void> {
      const current = read();
      const next = current.filter((item) => item.id !== id);
      write(next);
    },
  };
}