// src/data/documents.repo.ts
// ADR-OMK-001 D4 — repository for the `documents` table.

import { makeRepository } from './repository';
import { DOCUMENTS } from '@/lib/constants';
import type { Document } from '@/lib/types';

export const documentsRepo = makeRepository<Document>('documents', DOCUMENTS);
