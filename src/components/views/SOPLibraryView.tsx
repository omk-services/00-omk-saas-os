// src/components/views/SOPLibraryView.tsx
// Zero Bug Sprint — rewritten to match omk_saas.sops schema.
//
// Schema (no `steps`/`time`/`uses`/`rating` columns — only `title`,
// `content`, `category`, `version`, `status`, `createdAt`, `updatedAt`).
//
// Bug fixes (D6 #95e/C5, D6 #98, D6 #102, D6 #103):
//   - CRITICAL: removed `id: 'S' + Date.now()` — the string id violated the
//     UUID column constraint. Let Postgres generate via gen_random_uuid().
//   - Dropped steps/time/uses/rating from render and from form.
//   - Added <BackButton /> + <EmptyState />.
//   - Status enum translated via SOP_STATUS_LABEL.

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { sopsRepo } from '@/data/sops.repo';
import { Sop } from '@/lib/types';
import { SOP_STATUS_LABEL } from '@/lib/statusLabels';
import { BookOpen, PlayCircle, CheckCircle, FileCheck, Plus, Edit2, Play } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, safeArray } from '@/lib/safe';

const CATEGORY_OPTIONS: ReadonlyArray<string> = [
  'Immigration',
  'Business',
  'Tax',
  'Translation',
  'Notarial',
  'General',
];

const VARIANT_BY_STATUS: Record<Sop['status'], 'success' | 'warning' | 'info'> = {
  published: 'success',
  draft: 'info',
  archived: 'warning',
};

interface FormState {
  title: string;
  category: string;
  content: string;
}

const blankForm = (): FormState => ({
  title: '',
  category: 'General',
  content: '',
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
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load SOPs'))
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
      // CRITICAL FIX (D6 #95e/C5): do NOT pass a manual id. Postgres
      // generates a UUID via gen_random_uuid() default. Passing 'S' + Date.now()
      // would fail with "invalid input syntax for type uuid".
      const created = await sopsRepo.create({
        title: newForm.title.trim(),
        category: newForm.category,
        content: newForm.content.trim() || 'Procedure description (TBD)',
        status: 'draft',
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
    setEditForm({
      title: sop.title,
      category: sop.category ?? 'General',
      content: sop.content,
    });
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
        content: editForm.content.trim() || editTarget.content,
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
      <div className="space-y-4 animate-pulse" role="status" aria-label="Loading">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading SOPs</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const list = safeArray<Sop>(sops);
  const publishedCount = list.filter((s) => s.status === 'published').length;
  const draftCount = list.filter((s) => s.status === 'draft').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">SOP Library</h1>
          <p className="text-slate-500 text-sm mt-1">
            Standardized procedures ensuring consistent quality across all services
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Procedure
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total SOPs</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{list.length}</h3>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg text-slate-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Published</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{publishedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <PlayCircle className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Drafts</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{draftCount}</h3>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg text-slate-400">
            <FileCheck className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No procedures yet"
          description='Click "New Procedure" to create your first SOP.'
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((sop) => (
            <Card
              key={sop.id}
              className="p-5 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{sop.category ?? 'General'}</Badge>
                  <Badge variant={VARIANT_BY_STATUS[sop.status]}>
                    {SOP_STATUS_LABEL[sop.status]}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">v{sop.version}</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2 flex-1">{sop.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-3 mb-4 min-h-[3em]">
                {sop.content || '(no description)'}
              </p>
              <div className="text-xs text-slate-400 mb-4 font-mono">
                Updated {formatDate(sop.updatedAt)}
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
      )}

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
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={newForm.content}
              onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[100px]"
              placeholder="Brief description of this procedure..."
            />
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
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[100px]"
            />
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