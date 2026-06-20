import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { teamRepo } from '@/data/team.repo';
import { TeamMember, RoleAllocation } from '@/lib/types';
import { Users, Shield, Cpu, AlertCircle, UserPlus } from 'lucide-react';

const ROLE_ALLOCATIONS: ReadonlyArray<RoleAllocation> = [
  { id: 'R1', domain: 'Operations', ownerName: 'Amadou Diallo', ownerAvatar: 'AD' },
  { id: 'R2', domain: 'Sales', ownerName: 'Léa Martin', ownerAvatar: 'LM' },
  { id: 'R3', domain: 'Finance', ownerName: 'Amadou Diallo', ownerAvatar: 'AD' },
  { id: 'R4', domain: 'Legal', ownerName: 'Compliance-Sentinel', ownerAvatar: 'CS' },
  { id: 'R5', domain: 'IT & Data', ownerName: 'DocuFlow-Agent', ownerAvatar: 'DF' }
];

const TYPE_OPTIONS: ReadonlyArray<TeamMember['type']> = ['Founder', 'Freelance', 'AI'];

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

interface FormState {
  name: string;
  role: string;
  type: TeamMember['type'];
  load: number;
}

const blankForm = (): FormState => ({ name: '', role: '', type: 'Freelance', load: 50 });

export const PeopleView: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const load = (): void => {
    setLoading(true);
    teamRepo
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
    if (!form.name.trim() || !form.role.trim()) {
      showToast('Name and role are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const newMember: TeamMember = {
        id: 'M' + Date.now(),
        name: form.name.trim(),
        role: form.role.trim(),
        avatar: initialsFromName(form.name),
        type: form.type,
        load: Math.max(0, Math.min(100, Number(form.load) || 0)),
      };
      const created = await teamRepo.create(newMember);
      setMembers((prev) => [...prev, created]);
      setIsOpen(false);
      showToast(`Member "${created.name}" added.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add member.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
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

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-stone-200 rounded w-1/3"></div>
          <div className="h-32 bg-stone-100 rounded"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">Error: {error}</div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Capacity Load
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="p-5 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          member.type === 'AI'
                            ? 'bg-purple-50 border border-purple-100 text-purple-600'
                            : 'bg-stone-50 border border-stone-100 text-stone-600'
                        }`}
                      >
                        {member.avatar}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{member.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{member.role}</p>
                      </div>
                    </div>
                    {member.type === 'AI' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                        <Cpu className="w-3 h-3 mr-1" /> AI
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-500 border border-stone-200 shrink-0">
                        {member.type}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Load</span>
                      <div className="flex items-center gap-1.5">
                        {member.load > 90 && <AlertCircle className="w-3 h-3 text-amber-500" />}
                        <span className={`text-sm font-bold ${loadText(member.load)}`}>{member.load}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${loadColor(member.load)}`}
                        style={{ width: `${member.load}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4 pt-2">
            <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Role Distribution
            </h2>
            <Card className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Domain</th>
                    <th className="px-6 py-3">Owner</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ROLE_ALLOCATIONS.map((role) => (
                    <tr key={role.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-700">{role.domain}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-stone-200">
                            {role.ownerAvatar}
                          </div>
                          <span className="font-medium text-slate-600">{role.ownerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                          Covered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        </>
      )}

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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
            <input
              type="text"
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. Senior Translator"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TeamMember['type'] }))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Load (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.load}
                onChange={(e) => setForm((f) => ({ ...f, load: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PeopleView;
