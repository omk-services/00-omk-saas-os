import React from 'react';
import { Card } from '@/components/Card';
import { TeamMember, RoleAllocation } from '@/lib/types';
import { Users, Shield, Cpu, AlertCircle } from 'lucide-react';

const TEAM_MEMBERS: ReadonlyArray<TeamMember> = [
  { id: 'M1', name: 'Amadou Diallo', role: 'Founder · Operations', avatar: 'AD', type: 'Founder', load: 78 },
  { id: 'M2', name: 'Léa Martin', role: 'Senior Consultant', avatar: 'LM', type: 'Freelance', load: 62 },
  { id: 'M3', name: 'Intake-Agent', role: 'CRM data collector', avatar: 'IA', type: 'AI', load: 45 },
  { id: 'M4', name: 'Translator-Agent', role: 'Multilingual translator', avatar: 'TA', type: 'AI', load: 91 },
  { id: 'M5', name: 'DocuFlow-Agent', role: 'Document automation', avatar: 'DF', type: 'AI', load: 38 }
];

const ROLE_ALLOCATIONS: ReadonlyArray<RoleAllocation> = [
  { id: 'R1', domain: 'Operations', ownerName: 'Amadou Diallo', ownerAvatar: 'AD' },
  { id: 'R2', domain: 'Sales', ownerName: 'Léa Martin', ownerAvatar: 'LM' },
  { id: 'R3', domain: 'Finance', ownerName: 'Amadou Diallo', ownerAvatar: 'AD' },
  { id: 'R4', domain: 'Legal', ownerName: 'Compliance-Sentinel', ownerAvatar: 'CS' },
  { id: 'R5', domain: 'IT & Data', ownerName: 'DocuFlow-Agent', ownerAvatar: 'DF' }
];

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

export const PeopleView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Team & Capacity</h1>
          <p className="text-slate-500 text-sm mt-1">Resource planning for humans and AI agents.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-600 font-medium">System Healthy</span>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Capacity Load
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM_MEMBERS.map((member) => (
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
    </div>
  );
};

export default PeopleView;
