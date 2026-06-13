import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { SaleAgentStatus, SalePipelineColumn, SaleLog } from '@/lib/types';
import { Brain, Cpu, ShieldCheck, Activity, TrendingUp, Clock, Euro, Terminal } from 'lucide-react';

const VITALS: ReadonlyArray<{ label: string; value: string; trend: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: 'Closing Rate', value: '84.2%', trend: '+4.1%', icon: TrendingUp },
  { label: 'Avg. Time-to-Close', value: '3.2 Days', trend: '-12%', icon: Clock },
  { label: 'MTD Revenue Locked', value: '€142,500', trend: '+22%', icon: Euro }
];

const AGENT_ICONS = { Brain, Cpu, ShieldCheck, Activity } as const;

const SALE_AGENTS: ReadonlyArray<SaleAgentStatus> = [
  { id: 'SA1', name: 'Dr. Strange', role: 'Audit Logic', status: 'Active', iconName: 'Brain' },
  { id: 'SA2', name: 'Iron Man', role: 'UI Demo Render', status: 'Processing', iconName: 'Cpu' },
  { id: 'SA3', name: 'Black Panther', role: 'Deposit Signal', status: 'Active', iconName: 'ShieldCheck' },
  { id: 'SA4', name: 'Namor', role: 'Intent Threshold', status: 'Idle', iconName: 'Activity' }
];

const PIPELINE: ReadonlyArray<SalePipelineColumn> = [
  {
    id: 'PC1',
    title: 'Outreach',
    items: [
      { id: 'P1', name: 'TechFlow', sub: 'Cold email · 3 days' },
      { id: 'P2', name: 'Crimson Creative', sub: 'Cold email · 1 day' }
    ]
  },
  {
    id: 'PC2',
    title: 'Discovery',
    items: [
      { id: 'P3', name: 'GreenScale', sub: 'Call booked · Oct 22' },
      { id: 'P4', name: 'Zenith SEO', sub: 'Awaiting response' }
    ]
  },
  {
    id: 'PC3',
    title: 'Proposal',
    items: [
      { id: 'P5', name: 'Alaric Chen LLC', sub: 'Proposal sent' }
    ]
  },
  {
    id: 'PC4',
    title: 'Closed',
    items: [{ id: 'P6', name: 'Hassan Trade', sub: 'Signed · €18k' }]
  }
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

export const SalesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs'>('pipeline');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Sanctum</h2>
          <p className="text-slate-500 mt-1 text-sm">Managed by the Sales Director & The Illuminati</p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pipeline' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pipeline View
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Agent Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VITALS.map((kpi) => (
          <Card key={kpi.label} className="p-6 relative overflow-hidden hover:border-emerald-200 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <kpi.icon className="w-12 h-12 text-emerald-600" />
            </div>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">{kpi.label}</p>
            <div className="mt-3 flex items-baseline space-x-3">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
              <span
                className={`text-xs font-bold ${
                  kpi.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {kpi.trend}
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: '70%' }} />
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
          {PIPELINE.map((col) => (
            <Card key={col.id} className="p-4">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 mb-4 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{col.title}</span>
              </h4>
              <div className="space-y-3">
                {col.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 p-3 rounded-lg hover:border-emerald-200 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-500 italic mt-1">{item.sub}</p>
                  </div>
                ))}
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
  );
};

export default SalesView;
