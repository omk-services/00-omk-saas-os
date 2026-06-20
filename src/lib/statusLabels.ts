// src/lib/statusLabels.ts
// Zero Bug Sprint (D6 #102 follow-on) — DB enum → human-readable label maps.
//
// Postgres CHECK constraints enforce machine-friendly enums for status columns.
// The UI presents human-friendly labels. These maps centralize the translation
// so views don't duplicate the if/else chains.

import type { Client, Agent, Invoice, Sop, LegalDoc, SaleLead } from './types';

// Client.status: 'active' | 'paused' | 'archived' | 'prospect'
export const CLIENT_STATUS_LABEL: Record<Client['status'], string> = {
  active: 'Active',
  paused: 'Paused',
  archived: 'Archived',
  prospect: 'Prospect',
};

// Agent.status: 'active' | 'paused' | 'archived'
export const AGENT_STATUS_LABEL: Record<Agent['status'], string> = {
  active: 'Active',
  paused: 'Paused',
  archived: 'Archived',
};

// Agent.role: 'owner' | 'manager' | 'operator' | 'viewer'
export const AGENT_ROLE_LABEL: Record<NonNullable<Agent['role']>, string> = {
  owner: 'Owner',
  manager: 'Manager',
  operator: 'Operator',
  viewer: 'Viewer',
};

// Invoice.status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export const INVOICE_STATUS_LABEL: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// Sop.status: 'draft' | 'published' | 'archived'
export const SOP_STATUS_LABEL: Record<Sop['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

// LegalDoc.status: 'Signed' | 'Pending' | 'Draft' | 'Archived'
export const LEGAL_STATUS_LABEL: Record<LegalDoc['status'], string> = {
  Signed: 'Signed',
  Pending: 'Pending',
  Draft: 'Draft',
  Archived: 'Archived',
};

// SaleLead.stage (sales_leads.stage): 'Lead' | 'In Discussion' | 'Won' | 'Lost'
export const SALES_STAGE_LABEL: Record<SaleLead['stage'], string> = {
  Lead: 'Lead',
  'In Discussion': 'In Discussion',
  Won: 'Won',
  Lost: 'Lost',
};