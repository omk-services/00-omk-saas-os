// src/components/views/ClientDetailView.tsx
// Zero Bug Sprint — rewritten to match omk_saas.clients schema.
//
// Bug fixes (D6 #98, D6 #105a):
//   - `client.progress` removed (no DB column). Derived from status via STATUS_PROGRESS.
//   - `client.date` removed → use `client.createdAt` formatted via formatDate().
//   - Hardcoded "Org ID: 00000000-…-0001" replaced with `client.orgId ?? '—'` (real value).
//   - Hardcoded DEMO_DOCUMENTS / DEMO_TIMELINE removed (D6 #105a — they lied about data).
//   - Status enum translated via CLIENT_STATUS_LABEL.
//   - `Edit` and `Delete` buttons wired to use clientsRepo.update() / .remove().

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
  CalendarClock,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { clientsRepo } from '@/data/clients.repo';
import { documentsRepo } from '@/data/documents.repo';
import type { Client, Document } from '@/lib/types';
import { CLIENT_STATUS_LABEL } from '@/lib/statusLabels';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, safeArray, safeStr } from '@/lib/safe';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'not_found' }
  | { kind: 'ready'; client: Client; docs: Document[] };

const STATUS_PROGRESS: Record<Client['status'], number> = {
  active: 80,
  prospect: 20,
  paused: 50,
  archived: 100,
};

const VARIANT_BY_STATUS: Record<Client['status'], 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  prospect: 'info',
  paused: 'warning',
  archived: 'danger',
};

const truncateId = (id: string): string => `${id.slice(0, 8)}…`;

export const ClientDetailView: React.FC = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const load = (): void => {
    const id = params.id;
    if (!id) {
      setState({ kind: 'not_found' });
      return;
    }
    setState({ kind: 'loading' });
    Promise.all([clientsRepo.findById(id), documentsRepo.list()])
      .then(([client, allDocs]) => {
        if (!client) {
          setState({ kind: 'not_found' });
          return;
        }
        const linkedDocs = safeArray<Document>(allDocs).filter((d) => d.clientId === client.id);
        setState({ kind: 'ready', client, docs: linkedDocs });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load client';
        setState({ kind: 'error', message });
      });
  };

  useEffect(load, [params.id]);

  const handleBack = (): void => {
    navigate('/clients');
  };

  const handleDelete = async (): Promise<void> => {
    if (state.kind !== 'ready') return;
    const confirmed = window.confirm(`Delete ${state.client.name}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await clientsRepo.remove(state.client.id);
      showToast(`Client "${state.client.name}" deleted.`, 'success');
      navigate('/clients');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete client.', 'error');
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

  const { client, docs } = state;
  const initials = client.name
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const progress = STATUS_PROGRESS[client.status];

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
            onClick={() => showToast('Edit form coming in D2.', 'info')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
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
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight truncate">
                  {client.name}
                </h1>
                <p className="text-slate-500 text-sm mt-1 truncate">
                  {safeStr(client.email, '—')}
                </p>
              </div>
              <Badge variant={VARIANT_BY_STATUS[client.status]}>
                {CLIENT_STATUS_LABEL[client.status]}
              </Badge>
            </div>
            <div className="mt-4 h-px bg-stone-200" />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700">{progress}% complete</span>
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" /> Last update: {formatDate(client.updatedAt)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
              </div>
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
              <dd className="text-slate-900 font-medium truncate ml-3">{safeStr(client.email, '—')}</dd>
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
              <dd className="text-slate-700 font-mono text-xs">
                {client.orgId ? truncateId(client.orgId) : '—'}
              </dd>
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
              <dd className="text-slate-900 font-medium">{safeStr(client.service, '—')}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge variant={VARIANT_BY_STATUS[client.status]}>
                  {CLIENT_STATUS_LABEL[client.status]}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Status weight</dt>
              <dd className="text-slate-900 font-medium">{progress}%</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Started</dt>
              <dd className="text-slate-900 font-medium">{formatDate(client.createdAt)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Linked documents (from omk_saas.documents, filtered by clientId) */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" /> Documents ({docs.length})
        </h3>
        {docs.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No documents linked to this client yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-900 truncate">{doc.title}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-slate-500 font-mono">{doc.mimeType}</span>
                  <span className="text-xs text-slate-500">{formatDate(doc.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Activity timeline placeholder (D2) */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" /> Activity Timeline
        </h3>
        <p className="text-sm text-slate-400 italic">
          Activity timeline — D2 backlog (no omk_saas.activity table yet).
        </p>
      </Card>
    </div>
  );
};