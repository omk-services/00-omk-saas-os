// src/components/views/TasksView.tsx
// Phase I (2026-06-20) — rewired to use sopsRepo (the dropped tasks table was retired).
// SOPs serve as "executable procedures" = tasks. Future D2: add a real
// `omk_saas.tasks` table with deadline + completed columns.

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { sopsRepo } from '@/data/sops.repo';
import { clientsRepo } from '@/data/clients.repo';
import { Sop, Client } from '@/lib/types';
import { Check, BookOpen, ExternalLink, Plus } from 'lucide-react';

interface UISopRow extends Sop {
  /** UI-local "completed" toggle (not persisted — D2 will add real tasks table). */
  completed: boolean;
}

export const TasksView: React.FC = () => {
  const [sops, setSops] = useState<UISopRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; category: string }>({
    title: '',
    category: 'General',
  });
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([sopsRepo.list(), clientsRepo.list()]);
      setSops(
        s.map((row) => ({
          ...row,
          completed: row.status === 'archived', // visual proxy for "done"
        })),
      );
      setClients(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
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
      showToast('SOP title is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const newSop: Partial<Sop> = {
        title: form.title.trim(),
        category: form.category,
        status: 'draft',
      };
      const created = await sopsRepo.create(newSop);
      setSops((prev) => [...prev, { ...created, completed: false }]);
      setIsOpen(false);
      showToast(`SOP "${created.title}" created.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create SOP.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleSop = (id: string): void => {
    setSops((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
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
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Day</h1>
          <p className="text-slate-500 text-sm mt-1">Focus on execution. No noise.</p>
        </div>
        <div className="text-xs text-slate-500">
          {sops.filter((s) => s.completed).length} / {sops.length} completed
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-7">Procedure</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="divide-y divide-stone-100">
          {sops.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No procedures yet. Click <span className="font-medium">Add quick task</span> below to seed one.
            </div>
          ) : (
            sops.map((sop) => (
              <div
                key={sop.id}
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                  sop.completed ? 'bg-stone-50/50' : 'hover:bg-emerald-50/30'
                }`}
              >
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => toggleSop(sop.id)}
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
                    <span>{sop.steps} steps · {sop.time} · rating {sop.rating}/5</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-slate-600 border border-stone-200">
                    {sop.category}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end">
                  <a
                    href={`/sop`}
                    className="flex items-center px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Open SOP
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

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