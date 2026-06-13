import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { clientsRepo } from '@/data/clients.repo';
import { agentsRepo } from '@/data/agents.repo';
import { Client, Agent } from '@/lib/types';
import { RefreshCw, Clock, CheckCircle, Activity, BarChart3, ArrowUpRight, Briefcase, Cpu } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([clientsRepo.list(), agentsRepo.list()])
      .then(([c, a]) => { setClients(c); setAgents(a); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ecosystem Vitals</h1>
        <p className="text-slate-500 text-sm mt-1">Autonomous system managing your administrative operations</p>
      </div>
      <button className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-stone-50 transition-colors shadow-sm">
        <RefreshCw className="w-4 h-4" /> Sync Systems
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Processing Time', value: '2.3 days', badge: '-50%', icon: Clock, trend: 'good' },
        { label: 'SLA Compliance', value: '98.5%', badge: '+12%', icon: CheckCircle, trend: 'good' },
        { label: 'Approval Rate', value: '94.2%', badge: '+8%', icon: Activity, trend: 'good' },
        { label: 'Revenue MTD', value: '$48.2K', badge: '+23%', icon: BarChart3, trend: 'good' },
      ].map((kpi, i) => (
        <Card key={i} className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${kpi.trend === 'good' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="success">{kpi.badge}</Badge>
            <span className="text-xs text-slate-500">vs last month</span>
          </div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Wind Direction</h3>
            <span className="text-sm text-slate-500 italic">Things requiring validation</span>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Validation devis client TechFlow', time: 'Today', type: 'warning' },
              { title: 'Retard livraison projet GreenScale', time: 'Yesterday', type: 'danger' },
              { title: 'Mise à jour Stripe requise', time: '2 days ago', type: 'info' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${item.type === 'warning' ? 'bg-amber-500' : item.type === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1 group">
                  Review <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Client Pipeline</h3>
            <Badge variant="info">5 Active</Badge>
          </div>
          <div className="space-y-4">
            {clients.slice(0, 3).map(client => (
              <div key={client.id} className="p-4 rounded-xl border border-stone-100 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold border border-emerald-200">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{client.service}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 max-w-xs w-full lg:px-8">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-medium text-slate-900">{client.progress}%</span>
                  </div>
                  <ProgressBar progress={client.progress} />
                </div>
                <Badge variant={client.progress === 100 ? 'success' : client.progress > 50 ? 'info' : 'warning'}>
                  {client.status}
                </Badge>
              </div>
            ))}
          </div>
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
          <div className="space-y-4">
            {agents.slice(0, 4).map(agent => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">{agent.name}</span>
                </div>
                <span className="text-xs text-slate-400">{agent.status === 'active' ? 'Running' : 'Standby'}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
            View Swarm Details
          </button>
        </Card>
      </div>
    </div>
  </div>
  );
};
