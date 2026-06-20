// src/data/repository.ts
// ADR-OMK-001 D4 + ADR-OMK-005 (Phase C) — repository layer (multi-tenant aware).
//
// Two execution paths:
//   1. Supabase Cloud (when SUPABASE_READY): queries target `omk_saas.*` schema
//      (per ADR-OMK-004 single SaaS mode). RLS policies filter by `org_id`
//      from the JWT claim injected by `public.custom_access_token_hook`.
//   2. localStorage (dev fallback): seeded with mocks from constants.ts. RLS
//      is simulated by the in-memory filter `item.org_id === activeOrgId`.
//
// FIELD MAPPING (UI ↔ DB)
//   The UI types (Client, Document, etc.) are camelCase + have UI-only fields
//   like `date: string` (formatted). The DB columns are snake_case + `created_at`.
//   We map in two helpers: `toDbRow()` (UI → DB) and `fromDbRow()` (DB → UI).
//   This keeps the UI clean while enforcing schema strictness in storage.
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

// Mapping helpers. Subclasses can override if a particular table needs custom
// column names. Default: pass-through (caller is responsible for camelCase match).
type Mapper<T> = {
  toDb: (ui: Partial<T>) => Record<string, unknown>;
  fromDb: (row: Record<string, unknown>) => T;
};

const identityMapper = <T>(): Mapper<T> => ({
  toDb: (ui) => ui as Record<string, unknown>,
  fromDb: (row) => row as unknown as T,
});

interface MakeRepositoryOptions<T> {
  /** Override the default identity mapper if the UI type ≠ DB row shape. */
  mapper?: Mapper<T>;
}

export function makeRepository<T extends { id: string }>(
  table: string,
  seed: T[],
  options: MakeRepositoryOptions<T> = {},
): Repository<T> {
  const lsKey = `omk_${table}`;
  const mapper = options.mapper ?? identityMapper<T>();

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
