// src/components/views/ClientDetailView.tsx
// ADR-OMK-001 D4 — single client detail page (route /clients/:id).
// Uses clientsRepo.findById() (Phase D repository extension). Loading skeleton,
// not-found, and error states follow the same UX as ClientsView.

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  FileText,
  Mail,
  Building2,
  KeyRound,
  Briefcase,
  Activity,
  Hash,
  CalendarClock
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { clientsRepo } from '@/data/clients.repo';
import type { Client } from '@/lib/types';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'not_found' }
  | { kind: 'ready'; client: Client };

const statusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
  if (status === 'Validated' || status === 'Submitted') return 'success';
  if (status === 'Under Review') return 'warning';
  if (status === 'New Request') return 'danger';
  return 'info';
};

const truncateId = (id: string): string => `${id.slice(0, 8)}…`;

interface DocumentRow {
  name: string;
  state: 'Submitted' | 'Draft' | 'Validated';
  date: string;
}

const DEMO_DOCUMENTS: ReadonlyArray<DocumentRow> = [
  { name: 'passport_scan.pdf', state: 'Submitted', date: '2026-06-10' },
  { name: 'form_i-130.pdf', state: 'Draft', date: '2026-06-09' },
  { name: 'support_letter.docx', state: 'Validated', date: '2026-06-08' }
];

interface TimelineEvent {
  date: string;
  label: string;
}

const DEMO_TIMELINE: ReadonlyArray<TimelineEvent> = [
  { date: '2026-06-12 14:23', label: 'Status changed: New Request → In Progress' },
  { date: '2026-06-10 09:15', label: 'Document added: passport_scan.pdf' },
  { date: '2026-06-08 16:40', label: 'Client created' }
];

export const ClientDetailView: React.FC = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    const id = params.id;
    if (!id) {
      setState({ kind: 'not_found' });
      return;
    }
    setState({ kind: 'loading' });
    clientsRepo
      .findById(id)
      .then((client) => {
        if (client) {
          setState({ kind: 'ready', client });
        } else {
          setState({ kind: 'not_found' });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load client';
        setState({ kind: 'error', message });
      });
  }, [params.id]);

  const handleBack = (): void => {
    navigate('/clients');
  };

  const handleDelete = (): void => {
    if (state.kind !== 'ready') return;
    const confirmed = window.confirm(`Delete ${state.client.name}? This cannot be undone.`);
    if (confirmed) {
      navigate('/clients');
    }
  };

  if (state.kind === 'loading') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/4"></div>
        <div className="h-40 bg-stone-100 rounded"></div>
        <div className="h-64 bg-stone-100 rounded"></div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
        Error: {state.message}
      </div>
    );
  }

  if (state.kind === 'not_found') {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </button>
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Client not found</h2>
          <p className="text-slate-500 mt-2 text-sm">
            The client you are looking for does not exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  const { client } = state;
  const initials = client.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Edit client"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete client"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Hero card */}
      <Card className="p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-200 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight truncate">
                  {client.name}
                </h1>
                <p className="text-slate-500 text-sm mt-1 truncate">{client.email}</p>
              </div>
              <Badge variant={statusBadgeVariant(client.status)}>{client.status}</Badge>
            </div>
            <div className="mt-4 h-px bg-stone-200" />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700">{client.progress}% complete</span>
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" /> Last update: {client.date}
                </span>
              </div>
              <ProgressBar progress={client.progress} />
            </div>
          </div>
        </div>
      </Card>

      {/* Info grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" /> Key Information
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </dt>
              <dd className="text-slate-900 font-medium truncate ml-3">{client.email}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Phone
              </dt>
              <dd className="text-slate-400 italic text-xs">+ Add phone</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Org ID
              </dt>
              <dd className="text-slate-700 font-mono text-xs">00000000-…-0001</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Client ID
              </dt>
              <dd className="text-slate-700 font-mono text-xs">{truncateId(client.id)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400" /> Case Details
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Service</dt>
              <dd className="text-slate-900 font-medium">{client.service}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge variant={statusBadgeVariant(client.status)}>{client.status}</Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Progress</dt>
              <dd className="text-slate-900 font-medium">{client.progress}%</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Started</dt>
              <dd className="text-slate-900 font-medium">{client.date}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Documents */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" /> Documents ({DEMO_DOCUMENTS.length})
        </h3>
        <ul className="divide-y divide-stone-100">
          {DEMO_DOCUMENTS.map((doc) => (
            <li key={doc.name} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-900 truncate">{doc.name}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Badge
                  variant={
                    doc.state === 'Validated'
                      ? 'success'
                      : doc.state === 'Submitted'
                        ? 'info'
                        : 'warning'
                  }
                >
                  {doc.state}
                </Badge>
                <span className="text-xs text-slate-500">{doc.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Timeline */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" /> Activity Timeline
        </h3>
        <ol className="space-y-3">
          {DEMO_TIMELINE.map((event) => (
            <li key={event.label} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-900">{event.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{event.date}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
};