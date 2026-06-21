// src/components/views/AgentsView.tsx
// Zero Bug Sprint — fully rewritten to match the omk_saas.agents schema and
// prevent the `agent.capabilities.slice()` crash reported by A0 (D6 #95e).
//
// Field changes (D6 #98):
//   - Dropped `capabilities` (not a DB column) — was the crash site.
//   - Dropped `desc`, `tasks`, `accuracy`, `totalTasks`, `time` — none are DB cols.
//   - Now renders ONLY DB-backed fields: name, role, email, status.
//
// UX additions (D6 #102, D6 #103):
//   - <BackButton /> at top for in-page navigation back to Dashboard.
//   - <EmptyState /> when agents.length === 0.
//   - Status label via AGENT_STATUS_LABEL (DB enum → human label).

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { agentsRepo } from '@/data/agents.repo';
import { Agent } from '@/lib/types';
import { AGENT_STATUS_LABEL, AGENT_ROLE_LABEL } from '@/lib/statusLabels';
import { Cpu, CheckCircle, StopCircle, PlayCircle } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';

export const AgentsView: React.FC = () => {
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
        <p className="font-semibold">Error loading agents</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const list = safeArray<Agent>(agents);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">The Swarm Status</h1>
        <p className="text-slate-500 text-sm mt-1">
          Specialized AI agents working 24/7 across your ecosystem
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No agents configured"
          description="Add AI agents to start automating tasks across your ecosystem."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((agent) => {
            const status = agent.status ?? 'paused';
            const isActive = status === 'active';
            const roleLabel = agent.role ? AGENT_ROLE_LABEL[agent.role] : '—';
            return (
              <Card key={agent.id} className="flex flex-col p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 w-full h-1 ${
                    isActive ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />

                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}
                    >
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 leading-tight">{agent.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{roleLabel}</p>
                      {agent.email && (
                        <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">{agent.email}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={isActive ? 'success' : 'warning'}>
                    {AGENT_STATUS_LABEL[status]}
                  </Badge>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-stone-100">
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-xs text-slate-500">
                    {isActive ? 'Active and running' : 'Paused'}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400 font-mono">
                    {agent.id.slice(0, 8)}…
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-white border border-stone-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">
                    Configure
                  </button>
                  <button className="flex-1 bg-stone-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-1">
                    {isActive ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    {isActive ? 'Pause' : 'Start'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer summary */}
      {list.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t border-stone-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{list.filter((a) => a.status === 'active').length} active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StopCircle className="w-4 h-4 text-amber-500" />
            <span>{list.filter((a) => a.status !== 'active').length} paused</span>
          </div>
          <span className="ml-auto text-xs">{list.length} total agents</span>
        </div>
      )}
    </div>
  );
};

export default AgentsView;