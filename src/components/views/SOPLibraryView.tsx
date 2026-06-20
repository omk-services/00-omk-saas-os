import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { sopsRepo } from '@/data/sops.repo';
import { Sop } from '@/lib/types';
import { BookOpen, PlayCircle, CheckCircle, FileCheck, Plus, Clock, Users, Edit2, Play } from 'lucide-react';

const CATEGORY_OPTIONS: ReadonlyArray<string> = [
  'Immigration',
  'Business',
  'Tax',
  'Translation',
  'Notarial',
  'General',
];

interface FormState {
  title: string;
  category: string;
  steps: number;
  time: string;
}

const blankForm = (): FormState => ({
  title: '',
  category: 'General',
  steps: 5,
  time: '45 min',
});

export const SOPLibraryView: React.FC = () => {
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState<FormState>(blankForm());
  const [savingNew, setSavingNew] = useState(false);

  const [editTarget, setEditTarget] = useState<Sop | null>(null);
  const [editForm, setEditForm] = useState<FormState>(blankForm());
  const [savingEdit, setSavingEdit] = useState(false);

  const [executeTarget, setExecuteTarget] = useState<Sop | null>(null);

  const { showToast } = useToast();

  const load = (): void => {
    setLoading(true);
    sopsRepo
      .list()
      .then(setSops)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = (): void => {
    setNewForm(blankForm());
    setNewOpen(true);
  };
  const closeNew = (): void => {
    if (savingNew) return;
    setNewOpen(false);
  };

  const handleSaveNew = async (): Promise<void> => {
    if (!newForm.title.trim()) {
      showToast('Title is required.', 'error');
      return;
    }
    setSavingNew(true);
    try {
      const created = await sopsRepo.create({
        id: 'S' + Date.now(),
        title: newForm.title.trim(),
        category: newForm.category,
        steps: Math.max(1, Math.floor(Number(newForm.steps) || 1)),
        time: newForm.time.trim() || '45 min',
        uses: 0,
        rating: 0,
      });
      setSops((prev) => [...prev, created]);
      setNewOpen(false);
      showToast(`SOP "${created.title}" created.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create SOP.', 'error');
    } finally {
      setSavingNew(false);
    }
  };

  const openEdit = (sop: Sop): void => {
    setEditTarget(sop);
    setEditForm({ title: sop.title, category: sop.category, steps: sop.steps, time: sop.time });
  };
  const closeEdit = (): void => {
    if (savingEdit) return;
    setEditTarget(null);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editTarget) return;
    if (!editForm.title.trim()) {
      showToast('Title is required.', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await sopsRepo.update(editTarget.id, {
        title: editForm.title.trim(),
        category: editForm.category,
        steps: Math.max(1, Math.floor(Number(editForm.steps) || 1)),
        time: editForm.time.trim() || editTarget.time,
      });
      setSops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditTarget(null);
      showToast(`SOP "${updated.title}" updated.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update SOP.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExecute = (): void => {
    if (!executeTarget) return;
    const target = executeTarget;
    setExecuteTarget(null);
    showToast(`Execution started for "${target.title}".`, 'success');
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

  return (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">SOP Library</h1>
        <p className="text-slate-500 text-sm mt-1">Standardized procedures ensuring consistent quality across all services</p>
      </div>
      <button
        onClick={openNew}
        className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" /> New Procedure
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Master SOPs', value: sops.length, icon: BookOpen },
          { label: 'Total Executions', value: '1,217', icon: PlayCircle },
          { label: 'Avg Rating', value: '4.8', icon: CheckCircle },
          { label: 'Templates', value: '24', icon: FileCheck },
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sops.map(sop => (
        <Card key={sop.id} className="p-5 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <Badge variant="default">{sop.category}</Badge>
            <div className="flex items-center gap-1 text-amber-500 text-sm font-medium bg-amber-50 px-2 py-0.5 border border-amber-100 rounded">
              ★ {sop.rating}
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 text-lg mb-4 flex-1">{sop.title}</h3>

          <div className="grid grid-cols-3 gap-2 mt-auto mb-6">
            <div className="bg-stone-50 rounded p-2 text-center border border-stone-100">
              <span className="block text-xs text-slate-500 mb-1">Steps</span>
              <span className="font-semibold text-slate-900 text-sm">{sop.steps}</span>
            </div>
            <div className="bg-stone-50 rounded p-2 text-center border border-stone-100">
              <span className="block text-xs text-slate-500 mb-1">Avg Time</span>
              <span className="font-semibold text-slate-900 text-sm flex items-center justify-center gap-1"><Clock className="w-3 h-3 text-slate-400"/> {sop.time}</span>
            </div>
            <div className="bg-stone-50 rounded p-2 text-center border border-stone-100">
              <span className="block text-xs text-slate-500 mb-1">Uses</span>
              <span className="font-semibold text-slate-900 text-sm flex items-center justify-center gap-1"><Users className="w-3 h-3 text-slate-400"/> {sop.uses}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => openEdit(sop)}
              className="flex-1 border border-stone-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => setExecuteTarget(sop)}
              className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Execute
            </button>
          </div>
        </Card>
      ))}
    </div>

    <Modal
      open={newOpen}
      onClose={closeNew}
      title="New Procedure"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={closeNew}
            disabled={savingNew}
            className="bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSaveNew()}
            disabled={savingNew}
            className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60"
          >
            {savingNew ? 'Saving…' : 'Create SOP'}
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
            value={newForm.title}
            onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder="e.g. Client Onboarding Protocol"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
          <select
            value={newForm.category}
            onChange={(e) => setNewForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Steps</label>
            <input
              type="number"
              min={1}
              value={newForm.steps}
              onChange={(e) => setNewForm((f) => ({ ...f, steps: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Avg time</label>
            <input
              type="text"
              value={newForm.time}
              onChange={(e) => setNewForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="45 min"
            />
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      open={editTarget !== null}
      onClose={closeEdit}
      title={`Edit SOP — ${editTarget?.title ?? ''}`}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={closeEdit}
            disabled={savingEdit}
            className="bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSaveEdit()}
            disabled={savingEdit}
            className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60"
          >
            {savingEdit ? 'Saving…' : 'Save Changes'}
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
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
          <select
            value={editForm.category}
            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Steps</label>
            <input
              type="number"
              min={1}
              value={editForm.steps}
              onChange={(e) => setEditForm((f) => ({ ...f, steps: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Avg time</label>
            <input
              type="text"
              value={editForm.time}
              onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      open={executeTarget !== null}
      onClose={() => setExecuteTarget(null)}
      title={`Execute "${executeTarget?.title ?? ''}"?`}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={() => setExecuteTarget(null)}
            className="bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Execute
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">
        This will create a workflow run and notify assigned agents.
      </p>
    </Modal>
  </div>
  );
};

export default SOPLibraryView;
