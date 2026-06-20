import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { tasksRepo } from '@/data/tasks.repo';
import { clientsRepo } from '@/data/clients.repo';
import { sopsRepo } from '@/data/sops.repo';
import { Task, Client, Sop } from '@/lib/types';
import { Check, Calendar, ExternalLink, Plus } from 'lucide-react';

const isoFromDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const humanFromIso = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const defaultDeadline = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return isoFromDate(d);
};

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; project: string; deadline: string; sopLink: string }>({
    title: '',
    project: '',
    deadline: defaultDeadline(),
    sopLink: '',
  });
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const [t, c, s] = await Promise.all([tasksRepo.list(), clientsRepo.list(), sopsRepo.list()]);
      setTasks(t);
      setClients(c);
      setSops(s);
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
    setForm({ title: '', project: '', deadline: defaultDeadline(), sopLink: '' });
    setIsOpen(true);
  };
  const closeModal = (): void => {
    if (saving) return;
    setIsOpen(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.title.trim()) {
      showToast('Task title is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const newTask: Task = {
        id: 'T' + Date.now(),
        title: form.title.trim(),
        project: form.project || 'Quick Task',
        deadline: humanFromIso(form.deadline),
        completed: false,
        ...(form.sopLink ? { sopLink: form.sopLink } : {}),
      };
      const created = await tasksRepo.create(newTask);
      setTasks((prev) => [...prev, created]);
      setIsOpen(false);
      showToast(`Task "${created.title}" created.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create task.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = (id: string): void => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Day</h1>
          <p className="text-slate-500 text-sm mt-1">Focus on execution. No noise.</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-5">Task Name</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-3 text-right">Action</div>
        </div>

        <div className="divide-y divide-stone-100">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                task.completed ? 'bg-stone-50/50' : 'hover:bg-emerald-50/30'
              }`}
            >
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'border-stone-300 hover:border-emerald-400 bg-white'
                  }`}
                >
                  {task.completed && <Check className="w-4 h-4" />}
                </button>
              </div>

              <div className="col-span-5">
                <p
                  className={`text-sm font-medium ${
                    task.completed ? 'text-slate-400 line-through decoration-stone-300' : 'text-slate-800'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center mt-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span className={task.deadline === 'Today' ? 'text-amber-600 font-bold' : ''}>{task.deadline}</span>
                </div>
              </div>

              <div className="col-span-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-slate-600 border border-stone-200">
                  {task.project}
                </span>
              </div>

              <div className="col-span-3 flex justify-end">
                {task.sopLink ? (
                  <button className="flex items-center px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Open SOP
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">No SOP linked</span>
                )}
              </div>
            </div>
          ))}
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
        title="Add Quick Task"
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
              {saving ? 'Saving…' : 'Add Task'}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project (client)</label>
            <select
              value={form.project}
              onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">— Quick Task (no client) —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.service})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SOP link</label>
              <select
                value={form.sopLink}
                onChange={(e) => setForm((f) => ({ ...f, sopLink: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">— None —</option>
                {sops.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksView;
