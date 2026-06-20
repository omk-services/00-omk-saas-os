// src/data/legal-docs.repo.ts
// Phase D (2026-06-20) — repository for legal_docs (KBIS, RIB, contracts).

import { makeRepository } from './repository';

export interface LegalDocRow {
  id: string;
  title: string;
  type: 'PDF' | 'DOCX';
  category: 'Client' | 'Freelance' | 'Corporate';
  status: 'Signed' | 'Pending' | 'Draft' | 'Archived';
  date?: string;
  fileUrl?: string;
  notes?: string;
}

const SEED: LegalDocRow[] = [
  { id: 'L1', title: 'KBIS 2026 - Boulangerie Martin', type: 'PDF',  category: 'Client',    status: 'Signed',  date: '2026-01-15' },
  { id: 'L2', title: 'RIB - Coiffure Étoile',           type: 'PDF',  category: 'Client',    status: 'Signed',  date: '2026-02-03' },
  { id: 'L3', title: 'Contrat Atelier Bricolage',       type: 'DOCX', category: 'Client',    status: 'Pending', date: '2026-03-10' },
  { id: 'L4', title: 'KBIS Restaurant Le Sud',          type: 'PDF',  category: 'Client',    status: 'Signed',  date: '2026-04-01' },
  { id: 'L5', title: 'Statuts SARL Acme Demo',          type: 'PDF',  category: 'Corporate', status: 'Signed',  date: '2025-12-01' },
  { id: 'L6', title: 'Contrat Léa Martin (Freelance)',  type: 'PDF',  category: 'Freelance', status: 'Signed',  date: '2026-01-20' },
];

export const legalDocsRepo = makeRepository<LegalDocRow>('legal_docs', SEED);
