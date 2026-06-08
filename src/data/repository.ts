// src/data/repository.ts
// ADR-OMK-001 D4 — repository layer (Phase D).
// Uses Supabase (RLS-scoped, schema from APP_MODE) when env is configured;
// otherwise falls back to localStorage seeded with the provided mock data.
// This lets local dev work today and switch to Supabase automatically once
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (and schemas exist on the VPS).

import { supabase, SUPABASE_READY } from '@/lib/supabase';

export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  create(item: T): Promise<T>;
}

export function makeRepository<T extends { id: string }>(table: string, seed: T[]): Repository<T> {
  const lsKey = `omk_${table}`;

  if (SUPABASE_READY) {
    return {
      async list(): Promise<T[]> {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw new Error(`[${table}] ${error.message}`);
        return (data ?? []) as T[];
      },
      async create(item: T): Promise<T> {
        const { data, error } = await supabase.from(table).insert(item).select().single();
        if (error) throw new Error(`[${table}] ${error.message}`);
        return data as T;
      },
    };
  }

  // localStorage fallback (seeded with mocks) — preserves pre-Supabase behavior.
  const read = (): T[] => {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        return JSON.parse(raw) as T[];
      } catch {
        // corrupt cache → reseed below
      }
    }
    localStorage.setItem(lsKey, JSON.stringify(seed));
    return seed;
  };

  return {
    async list(): Promise<T[]> {
      return read();
    },
    async create(item: T): Promise<T> {
      const next = [...read(), item];
      localStorage.setItem(lsKey, JSON.stringify(next));
      return item;
    },
  };
}
