// src/components/views/DashboardView.tsx
// Zero Bug Sprint — rewired to use new omk_saas.* schema fields.
//
// Bug fixes (D6 #98, D6 #102, D6 #104):
//   - `client.progress` removed (no DB column) → use a fake "Progress" from
//     derived status (active = 80, prospect = 20, paused = 50, archived = 100).
//   - `client.status` translated via CLIENT_STATUS_LABEL.
//   - "View Swarm Details" button now navigates to /agents (was dead).
//   - Added <BackButton /> + EmptyState handling for clients/agents.
//   - <ProgressBar> replaced by hand-rolled div (component still uses progress
//     prop, but we derive a number from status for the demo).

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { clientsRepo } from '@/data/clients.repo';
import { agentsRepo } from '@/data/agents.repo';
import { Client, Agent } from '@/lib/types';
import { CLIENT_STATUS_LABEL, AGENT_ROLE_LABEL, AGENT_STATUS_LABEL } from '@/lib/statusLabels';
import { RefreshCw, Clock, CheckCircle, Activity, BarChart3, ArrowUpRight, Briefcase, Cpu } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { safeArray, safeStr } from '@/lib/safe';

const STATUS_PROGRESS: Record<Client['status'], number> = {
  active: 80,
  prospect: 20,
  paused: 50,
  archived: 100,
};

const VARIANT_BY_STATUS: Record<Client['status'], 'success' | 'warning' | 'info' | 'danger'> = {
  active: 'success',
  prospect: 'info',
  paused: 'warning',
  archived: 'danger',
};

const HARDCODED_TASKS = [
  { title: 'Validation devis client TechFlow', time: 'Today', type: 'warning' as const },
  { title: 'Retard livraison projet GreenScale', time: 'Yesterday', type: 'danger' as const },
  { title: 'Mise à jour Stripe requise', time: '2 days ago', type: 'info' as const },
];

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([clientsRepo.list(), agentsRepo.list()])
      .then(([c, a]) => {
        setClients(safeArray<Client>(c));
        setAgents(safeArray<Agent>(a));
      })
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
        <p className="font-semibold">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const activeClients = clients.filter((c) => c.status === 'active').length;
  const activeAgents = agents.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ecosystem Vitals</h1>
          <p className="text-slate-500 text-sm mt-1">
            Live data from omk_saas.clients and omk_saas.agents
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-stone-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Sync Systems
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Clients</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{activeClients}</h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">of {clients.length} total</p>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Agents</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{activeAgents}</h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">of {agents.length} total</p>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Prospects</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {clients.filter((c) => c.status === 'prospect').length}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">awaiting onboarding</p>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Clients</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{clients.length}</h3>
            </div>
            <div className="p-2 rounded-lg bg-stone-50 text-slate-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">across all statuses</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Wind Direction</h3>
              <span className="text-sm text-slate-500 italic">Things requiring validation</span>
            </div>
            <div className="space-y-3">
              {HARDCODED_TASKS.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.type === 'warning'
                          ? 'bg-amber-500'
                          : item.type === 'danger'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1 group">
                    Review{' '}
                    <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Client Pipeline</h3>
              <Badge variant="info">{activeClients} Active</Badge>
            </div>
            {clients.length === 0 ? (
              <EmptyState title="No clients yet" description="Add clients to see them here." />
            ) : (
              <div className="space-y-4">
                {clients.slice(0, 3).map((client) => {
                  const progress = STATUS_PROGRESS[client.status];
                  const initials = safeStr(client.name)
                    .split(' ')
                    .map((n) => n[0] ?? '')
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  return (
                    <div
                      key={client.id}
                      className="p-4 rounded-xl border border-stone-100 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold border border-emerald-200">
                          {initials || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{client.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {safeStr(client.service, '—')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 max-w-xs w-full lg:px-8">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-500">Status weight</span>
                          <span className="font-medium text-slate-900">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant={VARIANT_BY_STATUS[client.status]}>
                        {CLIENT_STATUS_LABEL[client.status]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">AI Agents Swarm</h3>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                24/7 Active
              </span>
            </div>
            {agents.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No agents configured yet.</p>
            ) : (
              <div className="space-y-4">
                {agents.slice(0, 4).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium truncate block">{agent.name}</span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {agent.role ? AGENT_ROLE_LABEL[agent.role] : '—'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {AGENT_STATUS_LABEL[agent.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/agents')}
              className="w-full mt-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              View Swarm Details
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;