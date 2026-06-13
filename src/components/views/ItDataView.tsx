import React from 'react';
import { Card } from '@/components/Card';
import { StackConnection } from '@/lib/types';
import { Server, Database, Activity, Wifi, Shield, HardDrive, RefreshCw } from 'lucide-react';

const STACK_CONNECTIONS: ReadonlyArray<StackConnection> = [
  { id: 'C1', name: 'Supabase Postgres', status: 'Connected', latency: '24ms', uptime: '99.98%', type: 'Database' },
  { id: 'C2', name: 'Stripe API', status: 'Connected', latency: '112ms', uptime: '99.92%', type: 'API' },
  { id: 'C3', name: 'Gemini Inference', status: 'Connected', latency: '380ms', uptime: '99.85%', type: 'AI' },
  { id: 'C4', name: 'Auth (JWT Hook)', status: 'Connected', latency: '18ms', uptime: '100%', type: 'Auth' },
  { id: 'C5', name: 'S3 Object Store', status: 'Maintenance', latency: '—', uptime: '99.50%', type: 'Database' }
];

const iconForType = (type: StackConnection['type']): React.ComponentType<{ className?: string }> => {
  if (type === 'Database') return Database;
  if (type === 'API') return Wifi;
  if (type === 'Auth') return Shield;
  return Activity;
};

const statusStyle = (status: StackConnection['status']): string => {
  if (status === 'Connected') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Maintenance') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

const statusDotStyle = (status: StackConnection['status']): string => {
  if (status === 'Connected') return 'bg-emerald-500';
  if (status === 'Maintenance') return 'bg-amber-500';
  return 'bg-red-500';
};

const latencyColor = (status: StackConnection['status']): string => {
  return status === 'Connected' ? 'text-emerald-600 font-bold' : 'text-slate-400';
};

export const ItDataView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">IT & Infrastructure</h1>
          <p className="text-slate-500 text-sm mt-1">System status, connectivity, and data health monitoring.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Stack Connectivity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {STACK_CONNECTIONS.map((conn) => {
            const Icon = iconForType(conn.type);
            return (
              <Card
                key={conn.id}
                className="p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-slate-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${statusStyle(conn.status)}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDotStyle(conn.status)}`} />
                    {conn.status}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">{conn.name}</h3>
                  <div className="flex justify-between items-end text-xs text-slate-500 font-mono pt-2 border-t border-stone-100 mt-2">
                    <span>
                      Latency: <span className={latencyColor(conn.status)}>{conn.latency}</span>
                    </span>
                    <span>Up: {conn.uptime}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          Data Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 flex flex-col items-center justify-center text-center hover:border-emerald-200 transition-colors">
            <div className="mb-3 p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <RefreshCw className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Last Backup</span>
            <span className="text-2xl font-bold text-slate-900 mt-1">24 mins ago</span>
            <span className="text-xs text-slate-500 mt-2">Automated · AES-256</span>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center text-center hover:border-blue-200 transition-colors">
            <div className="mb-3 p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <HardDrive className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Database Size</span>
            <span className="text-2xl font-bold text-slate-900 mt-1">4.2 GB</span>
            <div className="w-32 h-2 bg-stone-200 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 w-1/4 h-full rounded-full" />
            </div>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors">
            <div className="mb-3 p-3 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">API Requests</span>
            <span className="text-2xl font-bold text-slate-900 mt-1">1.2M / mo</span>
            <span className="text-xs text-slate-500 mt-2">Within Tier 2 Limits</span>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-600" />
          Service Inventory
        </h2>
        <Card className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Total Services</p>
              <p className="font-bold text-slate-900 text-lg">{STACK_CONNECTIONS.length}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Healthy</p>
              <p className="font-bold text-emerald-600 text-lg">
                {STACK_CONNECTIONS.filter((c) => c.status === 'Connected').length}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Maintenance</p>
              <p className="font-bold text-amber-600 text-lg">
                {STACK_CONNECTIONS.filter((c) => c.status === 'Maintenance').length}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Avg. Uptime</p>
              <p className="font-bold text-slate-900 text-lg">99.85%</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ItDataView;
