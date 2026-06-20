// src/data/sales-leads.repo.ts
// Phase D (2026-06-20) — repository for sales_leads (prospect → qualified → proposal → won).

import { makeRepository } from './repository';

export interface SalesLeadRow {
  id: string;
  name: string;
  contact?: string;
  value: number;
  currency: string;
  status: 'Active' | 'Paused' | 'Archived';
  stage: 'Lead' | 'In Discussion' | 'Won' | 'Lost';
  agency?: string;
  bleed?: string;
  bottleneck?: string;
  notes?: string;
  date?: string;
}

const SEED: SalesLeadRow[] = [
  { id: 'SL1', name: 'Cabinet Dupont & Associés', contact: 'lead@dupont.fr',     value: 15000, currency: 'EUR', status: 'Active', stage: 'In Discussion', agency: 'OMK Direct', date: '2026-05-12' },
  { id: 'SL2', name: 'Pharmacie Centrale',       contact: 'contact@pharma.fr',   value: 8500,  currency: 'EUR', status: 'Active', stage: 'Lead',          agency: 'Partner XYZ', bleed: 'Q4 budget', bottleneck: 'Decision Q1', date: '2026-05-20' },
  { id: 'SL3', name: 'Tech Startup Hub',         contact: 'founder@hub.io',     value: 24000, currency: 'EUR', status: 'Active', stage: 'In Discussion', agency: 'Inbound',     bottleneck: 'Comparing 3 SaaS', date: '2026-06-02' },
  { id: 'SL4', name: 'Logistique Express',       contact: 'cfo@logx.fr',        value: 32000, currency: 'EUR', status: 'Active', stage: 'Won',          agency: 'OMK Direct', date: '2026-06-15' },
];

export const salesLeadsRepo = makeRepository<SalesLeadRow>('sales_leads', SEED);
