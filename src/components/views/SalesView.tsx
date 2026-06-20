// src/components/views/SalesView.tsx
// Phase D (2026-06-20) — wired to omk_saas.sales_leads repo (kanban pulls from DB).
// KPI tiles + agent status remain computed/derived until Phase D2.

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/Card';
import { ViewShell } from '@/components/ViewShell';
import { salesLeadsRepo, type SalesLeadRow } from '@/data/sales-leads.repo';
import { useOrg } from '@/lib/tenant';
import { SaleAgentStatus, SaleLog } from '@/lib/types';
import { Brain, Cpu, ShieldCheck, Activity, TrendingUp, Clock, Euro, Terminal, RefreshCw } from 'lucide-react';

const AGENT_ICONS = { Brain, Cpu, ShieldCheck, Activity } as const;

// Mocked KPI tiles (computed in Phase D2 from sales_leads aggregation).
const VITALS: ReadonlyArray<{ label: string; value: string; trend: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: 'Closing Rate', value: '—', trend: 'computed in D2', icon: TrendingUp },
  { label: 'Avg. Time-to-Close', value: '—', trend: 'computed in D2', icon: Clock },
  { label: 'MTD Revenue Locked', value: '€—', trend: 'computed in D2', icon: Euro }
];

const SALE_AGENTS: ReadonlyArray<SaleAgentStatus> = [
  { id: 'SA1', name: 'Dr. Strange', role: 'Audit Logic', status: 'Active', iconName: 'Brain' },
  { id: 'SA2', name: 'Iron Man', role: 'UI Demo Render', status: 'Processing', iconName: 'Cpu' },
  { id: 'SA3', name: 'Black Panther', role: 'Deposit Signal', status: 'Active', iconName: 'ShieldCheck' },
  { id: 'SA4', name: 'Namor', role: 'Intent Threshold', status: 'Idle', iconName: 'Activity' }
];

const LOGS: ReadonlyArray<SaleLog> = [
  { id: 'LG1', time: '12:44:21', agent: 'Dr. Strange', msg: 'Audit logic for Alaric Chen complete.', status: 'success' },
  { id: 'LG2', time: '12:43:05', agent: 'Iron Man', msg: 'Rendering AaaS UI Demo for Zenith SEO.', status: 'info' },
  { id: 'LG3', time: '12:40:11', agent: 'Namor', msg: 'Lead Alaric Chen passed intent threshold (94%).', status: 'success' },
  { id: 'LG4', time: '12:35:58', agent: 'System', msg: 'Rotating agent authentication keys.', status: 'system' },
  { id: 'LG5', time: '12:32:44', agent: 'Black Panther', msg: 'Waiting for deposit signal from Crimson Creative.', status: 'info' }
];

const statusColor = (status: SaleAgentStatus['status']): string => {
  if (status === 'Active') return 'bg-emerald-50 text-emerald-600';
  if (status === 'Processing') return 'bg-amber-50 text-amber-600';
  return 'bg-stone-100 text-stone-400';
};

const statusDot = (status: SaleAgentStatus['status']): string => {
  if (status === 'Active') return 'bg-emerald-500 animate-pulse';
  if (status === 'Processing') return 'bg-amber-500 animate-pulse';
  return 'bg-stone-300';
};

// Map kanban stage → UI column title.
const STAGE_TO_TITLE: Readonly<Record<SalesLeadRow['stage'], string>> = {
  'Lead': 'Outreach',
  'In Discussion': 'Discovery',
  'Won': 'Closed',
  'Lost': 'Lost',
};

export const SalesView: React.FC = () => {
  const { isMissing } = useOrg();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs'>('pipeline');
  const [leads, setLeads] = useState<SalesLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((): void => {
    setLoading(true);
    setError(null);
    salesLeadsRepo
      .list()
      .then((rows) => {
        const normalized: SalesLeadRow[] = rows.map((r: unknown) => {
          const row = r as Record<string, unknown>;
          const stage = (row.stage as SalesLeadRow['stage']) ?? 'Lead';
          return {
            id: String(row.id),
            name: String(row.name ?? ''),
            contact: row.contact ? String(row.contact) : undefined,
            value: Number(row.value ?? 0),
            currency: String(row.currency ?? 'EUR'),
            status: (row.status === 'Active' || row.status === 'Paused' || row.status === 'Archived'
              ? row.status
              : 'Active') as SalesLeadRow['status'],
            stage,
            agency: row.agency ? String(row.agency) : undefined,
            bleed: row.bleed ? String(row.bleed) : undefined,
            bottleneck: row.bottleneck ? String(row.bottleneck) : undefined,
            notes: row.notes ? String(row.notes) : undefined,
            date: row.created_at ? String(row.created_at).substring(0, 10) : undefined,
          };
        });
        setLeads(normalized);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sales leads'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group leads by stage → kanban columns.
  const columns = (['Lead', 'In Discussion', 'Won', 'Lost'] as SalesLeadRow['stage'][]).map((stage) => ({
    id: stage,
    title: STAGE_TO_TITLE[stage],
    items: leads.filter((l) => l.stage === stage),
  }));

  // Compute KPIs from real data (lightweight aggregations).
  const totalRevenueLocked = leads
    .filter((l) => l.stage === 'Won')
    .reduce((sum, l) => sum + l.value, 0);
  const wonCount = leads.filter((l) => l.stage === 'Won').length;
  const closingRate = leads.length > 0 ? Math.round((wonCount / leads.length) * 100) : 0;
  const VITALS_LIVE = [
    { label: 'Closing Rate', value: `${closingRate}%`, trend: '+live', icon: TrendingUp },
    { label: 'Active Leads', value: `${leads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost').length}`, trend: 'live', icon: Clock },
    { label: 'MTD Revenue Locked', value: `€${totalRevenueLocked.toLocaleString()}`, trend: 'live', icon: Euro },
  ];

  return (
    <ViewShell
      title="Sales Sanctum"
      subtitle="Managed by the Sales Director & The Illuminati"
      loading={loading}
      error={error}
      isEmpty={leads.length === 0}
      emptyTitle="No leads yet"
      emptyDescription="Add your first prospect to start the pipeline."
      onRetry={load}
      actions={
        <>
          {isMissing && (
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium">
              No orgId — tenant isolation inactive
            </span>
          )}
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pipeline' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'logs' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Agent Logs
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VITALS_LIVE.map((kpi) => (
            <Card key={kpi.label} className="p-6 relative overflow-hidden hover:border-emerald-200 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <kpi.icon className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">{kpi.label}</p>
              <div className="mt-3 flex items-baseline space-x-3">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
                <span className={`text-xs font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="mt-4 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${closingRate}%` }} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SALE_AGENTS.map((agent) => {
            const Icon = AGENT_ICONS[agent.iconName];
            return (
              <div
                key={agent.id}
                className="bg-white border border-stone-200 p-4 rounded-xl flex items-center space-x-3 hover:border-emerald-200 transition-all shadow-sm"
              >
                <div className={`p-2 rounded-lg ${statusColor(agent.status)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-800 text-sm font-semibold truncate">{agent.name}</h4>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide truncate">{agent.role}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${statusDot(agent.status)}`} />
              </div>
            );
          })}
        </div>

        {activeTab === 'pipeline' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((col) => (
              <Card key={col.id} className="p-4">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 mb-4 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{col.title}</span>
                  <span className="text-slate-400 font-normal normal-case">({col.items.length})</span>
                </h4>
                <div className="space-y-3">
                  {col.items.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No leads in this stage</p>
                  ) : (
                    col.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-stone-200 p-3 rounded-lg hover:border-emerald-200 hover:shadow-sm transition-all"
                      >
                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          €{item.value.toLocaleString()} · {item.agency ?? 'no agency'}
                        </p>
                        {item.bottleneck && (
                          <p className="text-[10px] text-amber-600 italic mt-1">⚠ {item.bottleneck}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-stone-100">
              <Terminal className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Illuminati Swarm Logs</h3>
            </div>
            <div className="mt-4 space-y-2 font-mono text-xs">
              {LOGS.map((log) => (
                <div
                  key={log.id}
                  className="flex space-x-3 p-2 rounded hover:bg-stone-50 transition-colors border-l-2 border-transparent hover:border-emerald-500"
                >
                  <span className="text-slate-400 shrink-0">{log.time}</span>
                  <span
                    className={`font-bold shrink-0 w-28 ${
                      log.status === 'success'
                        ? 'text-emerald-600'
                        : log.status === 'system'
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    [{log.agent}]
                  </span>
                  <span className="text-slate-600">{log.msg}</span>
                </div>
              ))}
              <div className="flex items-center space-x-2 pt-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 font-bold">Listening for incoming signals...</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ViewShell>
  );
};

export default SalesView;
