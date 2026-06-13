// src/data/sops.repo.ts
// ADR-OMK-001 D4 — repository for the `sops` table.

import { makeRepository } from './repository';
import { SOPS } from '@/lib/constants';
import type { Sop } from '@/lib/types';

export const sopsRepo = makeRepository<Sop>('sops', SOPS);
