// src/lib/types.ts
// Zero Bug Sprint (D6 #98) — TypeScript types for the OMK dashboard, rewritten
// to match the canonical `omk_saas.*` schema exactly (ADR-OMK-001 ratified).
//
// Column source-of-truth: query `information_schema.columns WHERE table_schema = 'omk_saas'`
// on the live Supabase Cloud project. Every field on every interface below
// exists as a DB column. If the DB schema changes, regenerate this file.
//
// What changed vs the old types.ts (D6 #98):
//   - Client: dropped `progress` (no DB col), `date` (use `createdAt`/`updatedAt`),
//     status enum tightened to DB-allowed values.
//   - Document: dropped `name`/`client`/`type`/`status`/`size` (none exist on
//     documents table — only `title`/`clientId`/`fileUrl`/`mimeType`/`uploadedBy`).
//   - Agent: dropped `desc`/`tasks`/`totalTasks`/`accuracy`/`time`/`capabilities`
//     (none exist on agents table — only `name`/`role`/`email`/`status`).
//   - Invoice: dropped `client` (use `clientId`), `service` (no DB col),
//     `due` (use `dueAt`), `amount` is now `string` (PostgREST returns numeric
//     as string to preserve precision).
//   - Sop: dropped `steps`/`time`/`uses`/`rating` (none exist on sops table).
//   - Added new types: SaleLead (for sales_leads table), Organization, Membership.
//   - Removed UI-only types: Lead, SaleAgentStatus, SalePipelineItem,
//     SalePipelineColumn, SaleLog, MarketplaceItem, StackConnection.
//     Sales view now uses SaleLead type with derived shape.
//     Marketplace/ItData are still hardcoded mocks (D2 backlog).
//   - `createdAt`/`updatedAt` are full ISO strings (no substring trim) —
//     views call `formatDate()` from `lib/safe.ts` for display.

export type TabType =
  | 'dashboard'
  | 'finance'
  | 'people'
  | 'clients'
  | 'documents'
  | 'tasks'
  | 'sop'
  | 'legal'
  | 'agents'
  | 'growth'
  | 'sales'
  | 'marketplace'
  | 'it-data'
  | 'settings';

// ─────────────────────────────────────────────────────────────────────────
// omk_saas schema-accurate types
// ─────────────────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  orgId?: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  orgId?: string;
  userId: string;
  orgIdRef: string; // FK to organizations.id — renamed to avoid clash with the auto-mapped `orgId`
  role: 'owner' | 'admin' | 'member' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  orgId?: string;
  name: string;
  email: string | null;
  phone: string | null;
  service: string | null;
  status: 'active' | 'paused' | 'archived' | 'prospect';
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  orgId?: string;
  clientId: string;
  title: string;
  fileUrl: string;
  mimeType: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  orgId?: string;
  name: string;
  role: 'owner' | 'manager' | 'operator' | 'viewer';
  email: string | null;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  orgId?: string;
  clientId: string;
  /** PostgREST returns `numeric` as a string to preserve precision. */
  amount: string;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Sop {
  id: string;
  orgId?: string;
  title: string;
  content: string;
  category: string | null;
  version: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface LegalDoc {
  id: string;
  orgId?: string;
  clientId: string | null;
  title: string;
  type: 'PDF' | 'DOCX';
  category: 'Client' | 'Freelance' | 'Corporate';
  status: 'Signed' | 'Pending' | 'Draft' | 'Archived';
  fileUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleLead {
  id: string;
  orgId?: string;
  name: string;
  contact: string | null;
  /** PostgREST returns numeric as string. */
  value: string;
  currency: string;
  status: 'Active' | 'Paused' | 'Archived';
  stage: 'Lead' | 'In Discussion' | 'Won' | 'Lost';
  agency: string | null;
  bleed: string | null;
  bottleneck: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Derived view-side shapes (computed from DB rows in views, not persisted)
// ─────────────────────────────────────────────────────────────────────────

/** TasksView: SOPs displayed as procedures with a UI-only completed toggle. */
export interface SopTaskRow extends Sop {
  /** UI-local "completed" toggle (not persisted — D2 will add real tasks table). */
  completed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Auth + tenant types (Phase C, unchanged)
// ─────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  orgId: string | null;
  role: string;
  isAuthenticated: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}