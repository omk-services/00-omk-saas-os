// src/hooks/useCollection.ts
// ADR-OMK-001 D4 — React hook over the repository layer.
// Views consume this instead of importing mock constants directly.
// Provides {data, loading, error, create, reload}; works with Supabase or localStorage fallback.

import { useCallback, useEffect, useState } from 'react';
import { makeRepository } from '@/data/repository';

export function useCollection<T extends { id: string }>(table: string, seed: T[]) {
  const [repo] = useState(() => makeRepository<T>(table, seed));
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setData(await repo.list());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (item: T): Promise<T> => {
      const created = await repo.create(item);
      setData((prev) => [...prev, created]);
      return created;
    },
    [repo],
  );

  return { data, loading, error, create, reload };
}
