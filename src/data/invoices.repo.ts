// src/data/invoices.repo.ts
// ADR-OMK-001 D4 — repository for the `invoices` table.

import { makeRepository } from './repository';
import { INVOICES } from '@/lib/constants';
import type { Invoice } from '@/lib/types';

export const invoicesRepo = makeRepository<Invoice>('invoices', INVOICES);
