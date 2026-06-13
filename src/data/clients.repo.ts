// src/data/clients.repo.ts
// ADR-OMK-001 D4 — repository for the `clients` table.
// Seeded with the canonical mock CLIENTS from @/lib/constants so the localStorage
// fallback matches the pre-Phase-D UX exactly. When Supabase is configured, the
// repository routes to the Supabase table.

import { makeRepository } from './repository';
import { CLIENTS } from '@/lib/constants';
import type { Client } from '@/lib/types';

export const clientsRepo = makeRepository<Client>('clients', CLIENTS);
