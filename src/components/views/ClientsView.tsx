import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { clientsRepo } from '@/data/clients.repo';
import { Client } from '@/lib/types';
import { Search, Plus, Users, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const SERVICE_OPTIONS: ReadonlyArray<string> = [
  'Immigration Visa',
  'Business Formation',
  'Tax Consulting',
  'Certified Translation',
  'Notarial',
];

const STATUS_OPTIONS: ReadonlyArray<string> = [
  'New Request',
  'In Progress',
  'Under Review',
  'Submitted',
  'Validated',
];

const formatDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    service: string;
    status: string;
    progress: number;
    notes: string;
  }>({
    name: '',
    email: '',
    service: '',
    status: 'New Request',
    progress: 10,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const load = (): void => {
    setLoading(true);
    clientsRepo
      .list()
      .then(setClients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (): void => {
    setForm({ name: '', email: '', service: '', status: 'New Request', progress: 10, notes: '' });
    setIsOpen(true);
  };
  const closeModal = (): void => {
    if (saving) return;
    setIsOpen(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim() || !form.email.trim() || !form.service) {
      showToast('Name, email, and service are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const newClient: Client = {
        id: 'C' + (clients.length + 1) + '-' + Date.now(),
        name: form.name.trim(),
        email: form.email.trim(),
        service: form.service,
        status: form.status,
        progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
        date: formatDate(new Date()),
      };
      const created = await clientsRepo.create(newClient);
      setClients((prev) => [...prev, created]);
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
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded"></div>
      </div>
    );
  }
  if (error) {
    return <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">Error: {error}</div>;
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Case Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all your client files and cases</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, icon: Users },
          { label: 'Active Cases', value: clients.filter(c => c.progress < 100).length, icon: Clock },
          { label: 'Completed', value: clients.filter(c => c.progress === 100).length, icon: CheckCircle },
          { label: 'New Requests', value: clients.filter(c => c.status === 'New Request').length, icon: AlertCircle },
        ].map((stat, i) => (
          <Card key={i} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg text-slate-400">
              <stat.icon className="w-5 h-5" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col">
        <div className="p-4 border-b border-stone-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <button className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Service</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Progress</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs border border-emerald-200">
                        {client.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    <div className="flex items-center gap-2 mt-2">
                      <FileText className="w-4 h-4 text-slate-400" /> {client.service}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={
                      client.status === 'Validated' || client.status === 'Submitted' ? 'success' :
                      client.status === 'Under Review' ? 'warning' :
                      client.status === 'New Request' ? 'danger' : 'info'
                    }>
                      {client.status}
                    </Badge>
                  </td>
                  <td className="p-4 w-48">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{client.progress}%</span>
                    </div>
                    <ProgressBar progress={client.progress} />
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/clients/${client.id}`}
                      className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors tooltip-trigger"
                      title="View client details"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={isOpen}
        onClose={closeModal}
        title="New Client"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
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
              {saving ? 'Saving…' : 'Save Client'}
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
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service *</label>
            <select
              required
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Select a service…</option>
              {SERVICE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Progress (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Internal notes about this client…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientsView;
