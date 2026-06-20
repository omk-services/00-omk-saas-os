// src/components/views/ClientsView.tsx
// Zero Bug Sprint — rewritten to match omk_saas.clients schema.
//
// Bug fixes (D6 #95e, D6 #98, D6 #102, D6 #103):
//   - (c.email ?? '').toLowerCase() prevents the null-email TypeError crash
//     (email column is nullable per DB schema).
//   - Status enum translated via CLIENT_STATUS_LABEL.
//   - Added <BackButton /> + <EmptyState />.
//   - Search filter is now wired (state + onChange).
//   - CreatedAt formatted via formatDate() instead of undefined `date`.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { clientsRepo } from '@/data/clients.repo';
import { Client } from '@/lib/types';
import { CLIENT_STATUS_LABEL } from '@/lib/statusLabels';
import { useToast } from '@/contexts/ToastContext';
import { Plus, Search } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, safeArray, safeStr } from '@/lib/safe';

const VARIANT_BY_STATUS: Record<Client['status'], 'success' | 'warning' | 'info' | 'danger'> = {
  active: 'success',
  prospect: 'info',
  paused: 'warning',
  archived: 'danger',
};

export const ClientsView: React.FC = () => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', service: '' });
  const [saving, setSaving] = useState(false);

  const load = (): void => {
    setLoading(true);
    setError(null);
    clientsRepo.list()
      .then(setClients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load clients'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const list = safeArray<Client>(clients);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      // D6 #95e: defensive null guards on every field
      const name = safeStr(c.name).toLowerCase();
      const email = safeStr(c.email).toLowerCase();
      const service = safeStr(c.service).toLowerCase();
      return name.includes(q) || email.includes(q) || service.includes(q);
    });
  }, [list, search]);

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      showToast('Client name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const created = await clientsRepo.create({
        name: form.name.trim(),
        email: form.email.trim() || null,
        service: form.service.trim() || null,
        status: 'prospect',
      });
      setClients((prev) => [...prev, created]);
      setForm({ name: '', email: '', service: '' });
      setIsOpen(false);
      showToast(`Client "${created.name}" created.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create client.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" role="status" aria-label="Loading">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading clients</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">All clients in your organization</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{list.length}</h3>
          <p className="text-xs font-medium text-slate-400 mt-2">clients</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Active</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {list.filter((c) => c.status === 'active').length}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-2">engagements in progress</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Prospects</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {list.filter((c) => c.status === 'prospect').length}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-2">awaiting onboarding</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Paused</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {list.filter((c) => c.status === 'paused').length}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-2">on hold</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, email, or service..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={list.length === 0 ? 'No clients yet' : 'No clients match your search'}
            description={
              list.length === 0
                ? 'Click "Add Client" to create your first record.'
                : 'Try a different search term.'
            }
          />
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Service</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4">
                    <Link
                      to={`/clients/${c.id}`}
                      className="font-medium text-slate-900 text-sm hover:text-emerald-600"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-slate-700">{safeStr(c.email, '—')}</td>
                  <td className="p-4 text-sm text-slate-500">{safeStr(c.service, '—')}</td>
                  <td className="p-4">
                    <Badge variant={VARIANT_BY_STATUS[c.status]}>
                      {CLIENT_STATUS_LABEL[c.status]}
                    </Badge>
                  </td>
                  <td className="p-4 text-right text-sm text-slate-500 font-mono">
                    {formatDate(c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Client"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={saving}
              className="bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add Client'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. Boulangerie Martin"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="contact@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service</label>
            <input
              type="text"
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. comptabilite"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientsView;