// src/components/views/PeopleAgentsView.tsx
// Sidebar V2 — Triptyque 1 CULTIVATE — fusion People + AI Agents Network.
// D6 #NEW: route /people-agents. Old routes /people + /agents keep working (D4 append-only).
//
// Doctrine: humans + AI agents ONE workspace — Team & Capacity load + Swarm Status.
// Sister canon: _ROSTER.md (35 A3 canon) + agentsRepo (omk_saas.agents schema).

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { agentsRepo } from '@/data/agents.repo';
import { Agent } from '@/lib/types';
import { AGENT_STATUS_LABEL, AGENT_ROLE_LABEL } from '@/lib/statusLabels';
import {
  Users, Cpu, UserPlus, PlayCircle, StopCircle, CheckCircle
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { safeArray, safeNum } from '@/lib/safe';

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] || '?') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
};

const loadColor = (load: number): string => {
  if (load > 90) return 'bg-amber-500';
  if (load > 70) return 'bg-amber-400';
  return 'bg-emerald-500';
};

export const PeopleAgentsView: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    agentsRepo.list()
      .then(setAgents)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

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

  const list = safeArray<Agent>(agents);
  // Heuristic: humans = role owner/manager | AI agents = role operator/viewer + status active
  const humans = list.filter((a) => a.role === 'owner' || a.role === 'manager');
  const aiAgents = list.filter((a) => a.role === 'operator' || a.role === 'viewer');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">People & Agents</h1>
          <p className="text-slate-500 text-sm mt-1">
            Triptyque 1 — humans + AI agents same workspace ({list.length} total)
          </p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Humans — Team & Capacity */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Humans — Capacity Load ({humans.length})
        </h2>
        {humans.length === 0 ? (
          <EmptyState title="No humans yet" description="Add team members to seed your company." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {humans.map((member) => {
              const seed = member.email
                ? safeNum(member.email.split('').reduce((s, c) => s + c.charCodeAt(0), 0), 0)
                : 0;
              const load = 30 + (seed % 60);
              const roleLabel = member.role ? AGENT_ROLE_LABEL[member.role] : '—';
              return (
                <Card key={member.id} className="p-5 hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      member.role === 'manager'
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                        : 'bg-purple-50 border border-purple-100 text-purple-600'
                    }`}>
                      {initialsFromName(member.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-800 truncate">{member.name}</h3>
                      {member.email && (
                        <p className="text-xs text-slate-500 truncate font-mono">{member.email}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-purple-600">
                      {roleLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Estimated Load
                    </span>
                    <span className="text-sm font-bold text-emerald-600">{load}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${loadColor(load)}`} style={{ width: `${load}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Agents — Swarm Status */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          AI Agents — Swarm Status ({aiAgents.length})
        </h2>
        {aiAgents.length === 0 ? (
          <EmptyState title="No AI agents" description="Configure B2/B3 agents in Agents Network section." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiAgents.map((agent) => {
              const isActive = agent.status === 'active';
              const roleLabel = agent.role ? AGENT_ROLE_LABEL[agent.role] : '—';
              return (
                <Card key={agent.id} className="p-5 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <div className="flex items-start justify-between mb-3 mt-2">
                    <div className="flex items-center gap-2">
                      <Cpu className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    </div>
                    <Badge variant={isActive ? 'success' : 'warning'}>
                      {AGENT_STATUS_LABEL[agent.status ?? 'paused']}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-white border border-stone-200 text-slate-700 py-1.5 rounded text-xs font-medium hover:bg-stone-50 transition-colors">
                      Configure
                    </button>
                    <button className="flex-1 bg-stone-100 text-slate-700 py-1.5 rounded text-xs font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-1">
                      {isActive ? <StopCircle className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                      {isActive ? 'Pause' : 'Start'}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer summary */}
      {list.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t border-stone-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{list.filter((a) => a.status === 'active').length} active</span>
          </div>
          <span className="ml-auto text-xs">{list.length} total • {humans.length} humans • {aiAgents.length} AI</span>
        </div>
      )}
    </div>
  );
};

export default PeopleAgentsView;
