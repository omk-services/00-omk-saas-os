// src/lib/constants.ts
// Zero Bug Sprint (D6 #110b) — localStorage seed arrays.
//
// PREVIOUSLY: this file held hardcoded mock seeds (CLIENTS, DOCUMENTS, AGENTS,
// INVOICES, SOPS) with fields that did NOT match the canonical omk_saas schema
// (e.g. `Client.progress`, `Document.name`, `Agent.capabilities`, `Invoice.client`,
// `Sop.steps` — none exist as DB columns).
//
// NOW: all seed arrays are empty. The dashboard reads from Supabase Cloud
// (omk_saas.*) when SUPABASE_READY is true, which is the production path.
// localStorage mode is dev-only and unused in the live site; if a dev
// environment needs localStorage data, use the seed/dev SQL migration
// (omk_saas_seed_dev_acme_demo) to populate real rows instead.
//
// Keeping the empty array exports so the import sites in src/data/*.repo.ts
// continue to compile without changes.

import type { Client, Document, Agent, Invoice, Sop } from './types';

export const CLIENTS: Client[] = [];

export const DOCUMENTS: Document[] = [];

export const AGENTS: Agent[] = [];

export const INVOICES: Invoice[] = [];

export const SOPS: Sop[] = [];