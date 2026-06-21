// src/components/views/TasksView.tsx
// Zero Bug Sprint — rewritten to match omk_saas.sops schema (sops = procedures).
//
// Schema (no `steps`/`time`/`uses`/`rating` columns).
// Bug fixes (D6 #98, D6 #100b, D6 #102, D6 #103):
//   - Removed undefined `sop.steps` / `sop.time` / `sop.rating` (no DB cols).
//   - Use `formatDate()` instead of undefined `sop.date`.
//   - Use React Router <Link> instead of <a href> (preserves ShellLayout).
//   - Added <BackButton /> + <EmptyState />.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { sopsRepo } from '@/data/sops.repo';
import { clientsRepo } from '@/data/clients.repo';
import { Sop, SopTaskRow, Client } from '@/lib/types';
import { SOP_STATUS_LABEL } from '@/lib/statusLabels';
import { Check, BookOpen, ExternalLink, Plus } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<SopTaskRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'General' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = (): void => {
    setLoading(true);
    setError(null);
    Promise.all([sopsRepo.list(), clientsRepo.list()])
      .then(([s, c]) => {
        // UI-local "completed" toggle proxy: archived SOPs are "done".
        setTasks(
          safeArray<Sop>(s).map((row) => ({
            ...row,
            completed: row.status === 'archived',
          })),
        );
        setClients(safeArray<Client>(c));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (): void => {
    setForm({ title: '', category: 'General' });
    setIsOpen(true);
  };
  const closeModal = (): void => {
    if (saving) return;
    setIsOpen(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.title.trim()) {
      showToast('Title is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const newSop: Partial<Sop> = {
        title: form.title.trim(),
        category: form.category,
        content: '',
        status: 'draft',
      };
      const created = await sopsRepo.create(newSop);
      setTasks((prev) => [...prev, { ...created, completed: false }]);
      setIsOpen(false);
      showToast(`SOP "${created.title}" created.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create SOP.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = (id: string): void => {
    // UI-local only — not persisted. D2 will add a real tasks table.
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
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
        <p className="font-semibold">Error loading tasks</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Day</h1>
          <p className="text-slate-500 text-sm mt-1">Focus on execution. No noise.</p>
        </div>
        <div className="text-xs text-slate-500">
          {tasks.filter((t) => t.completed).length} / {tasks.length} completed
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-7">Procedure</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title="No procedures yet"
            description='Click "Add quick task" below to seed one.'
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {tasks.map((sop) => (
              <div
                key={sop.id}
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                  sop.completed ? 'bg-stone-50/50' : 'hover:bg-emerald-50/30'
                }`}
              >
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => toggleTask(sop.id)}
                    aria-label={sop.completed ? 'Mark incomplete' : 'Mark complete'}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      sop.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : 'border-stone-300 hover:border-emerald-400 bg-white'
                    }`}
                  >
                    {sop.completed && <Check className="w-4 h-4" />}
                  </button>
                </div>

                <div className="col-span-7">
                  <p
                    className={`text-sm font-medium ${
                      sop.completed ? 'text-slate-400 line-through decoration-stone-300' : 'text-slate-800'
                    }`}
                  >
                    {sop.title}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-slate-500">
                    <BookOpen className="w-3 h-3 mr-1" />
                    <span>v{sop.version} · {SOP_STATUS_LABEL[sop.status]}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-slate-600 border border-stone-200">
                    {sop.category ?? 'General'}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end">
                  <Link
                    to="/sop"
                    className="flex items-center px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Open SOPs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-stone-50 border-t border-stone-100 text-center">
          <button
            onClick={openModal}
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors py-2 w-full border border-dashed border-stone-200 rounded-xl hover:border-emerald-300 hover:bg-white flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add quick task
          </button>
        </div>
      </Card>

      <Modal
        open={isOpen}
        onClose={closeModal}
        title="Add Quick SOP"
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
              {saving ? 'Saving…' : 'Add SOP'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. Follow up with John Smith"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. onboarding"
            />
          </div>
          <p className="text-xs text-slate-500 italic">
            Procedure linked to {clients.length} client{clients.length === 1 ? '' : 's'}.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default TasksView;