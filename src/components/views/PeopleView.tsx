// src/components/views/PeopleView.tsx
// Phase I (2026-06-20) — rewired to use agentsRepo instead of the dropped team table.
// The UI concept of "team members" maps to AI agents (omk_saas.agents) — humans + AI
// are rendered as a unified Capacity Load grid. Future D2 work: add a real
// `omk_saas.team_members` table when human resources need their own CRUD.

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { agentsRepo } from '@/data/agents.repo';
import { Agent } from '@/lib/types';
import { Users, Cpu, AlertCircle, UserPlus } from 'lucide-react';

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const loadColor = (load: number): string => {
  if (load > 90) return 'bg-amber-500';
  if (load > 70) return 'bg-amber-400';
  return 'bg-emerald-500';
};

const loadText = (load: number): string => {
  if (load > 90) return 'text-amber-600';
  if (load > 70) return 'text-amber-500';
  return 'text-emerald-600';
};

const ROLE_OPTIONS: ReadonlyArray<Agent['role']> = ['manager', 'operator', 'viewer', 'owner'];

interface FormState {
  name: string;
  role: Agent['role'];
  email: string;
}

const blankForm = (): FormState => ({ name: '', role: 'operator', email: '' });

export const PeopleView: React.FC = () => {
  const [members, setMembers] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const load = (): void => {
    setLoading(true);
    agentsRepo
      .list()
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (): void => {
    setForm(blankForm());
    setIsOpen(true);
  };
  const closeModal = (): void => {
    if (saving) return;
    setIsOpen(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const newAgent: Partial<Agent> = {
        name: form.name.trim(),
        role: form.role,
        status: 'active',
        email: form.email.trim() || undefined,
      };
      const created = await agentsRepo.create(newAgent);
      setMembers((prev) => [...prev, created]);
      setIsOpen(false);
      showToast(`Member "${created.name}" added.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add member.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Compute a "load" indicator from accuracy: high accuracy == low load.
  // (Real load metric is D2 backlog; for now we surface a stable signal.)
  const loadFromAccuracy = (accuracy: number): number => Math.max(5, 100 - accuracy);

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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Team & Capacity</h1>
          <p className="text-slate-500 text-sm mt-1">Resource planning for humans and AI agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add New Member
          </button>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600 font-medium">System Healthy</span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Capacity Load
        </h2>
        {members.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <p className="text-sm">No team members yet. Click <span className="font-medium">Add New Member</span> to seed your team.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const load = loadFromAccuracy(member.accuracy);
              return (
                <Card key={member.id} className="p-5 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          member.role === 'manager'
                            ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                            : member.role === 'owner'
                            ? 'bg-purple-50 border border-purple-100 text-purple-600'
                            : 'bg-stone-50 border border-stone-100 text-stone-600'
                        }`}
                      >
                        {initialsFromName(member.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{member.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{member.desc}</p>
                      </div>
                    </div>
                    {member.role === 'manager' || member.role === 'owner' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                        <Cpu className="w-3 h-3 mr-1" /> {member.role}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-500 border border-stone-200 shrink-0">
                        {member.role}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Load</span>
                      <div className="flex items-center gap-1.5">
                        {load > 90 && <AlertCircle className="w-3 h-3 text-amber-500" />}
                        <span className={`text-sm font-bold ${loadText(load)}`}>{load}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${loadColor(load)}`}
                        style={{ width: `${load}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Accuracy: {member.accuracy}%</span>
                    <span>{member.tasks}/{member.totalTasks} tasks</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={isOpen}
        onClose={closeModal}
        title="Add New Member"
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
              {saving ? 'Saving…' : 'Add Member'}
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
              placeholder="e.g. Sarah Johnson"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="sarah@acme-demo.fr"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Agent['role'] }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PeopleView;