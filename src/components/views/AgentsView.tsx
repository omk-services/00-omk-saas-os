import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { agentsRepo } from '@/data/agents.repo';
import { Agent } from '@/lib/types';
import { Cpu, CheckCircle, StopCircle, PlayCircle, Activity } from 'lucide-react';

export const AgentsView: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    agentsRepo.list()
      .then(setAgents)
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">The Swarm Status</h1>
          <p className="text-slate-500 text-sm mt-1">Specialized AI agents working 24/7 across your ecosystem</p>
        </div>
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          {showLogs ? 'View Swarm Network' : 'View Agent Logs'}
        </button>
      </div>

      {!showLogs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col p-6 hover:shadow-md transition-shadow relative overflow-hidden">
              {/* Status Indicator Bar */}
              <div className={`absolute top-0 left-0 w-full h-1 ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              
              <div className="flex items-start justify-between mb-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${agent.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-tight">{agent.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="text-xs uppercase font-semibold text-slate-500">{agent.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6 flex-1">{agent.desc}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-xs text-slate-500 mb-1">Tasks Today</p>
                  <p className="text-lg font-semibold text-slate-900">{agent.tasks}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-xs text-slate-500 mb-1">Accuracy</p>
                  <p className="text-lg font-semibold text-slate-900">{agent.accuracy}%</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Capabilities</p>
                {agent.capabilities.slice(0, 3).map((cap, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{cap}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex gap-2">
                <button className="flex-1 bg-white border border-stone-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">
                  Configure
                </button>
                <button className="flex-1 bg-stone-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors relative group overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    {agent.status === 'active' ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    {agent.status === 'active' ? 'Pause' : 'Start'}
                  </span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-sm p-6 overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-emerald-400 border-b border-slate-800 pb-4">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="font-semibold tracking-wider">SECURE_ROOT//SWARM_TERMINAL</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 opacity-90 pb-4">
            <div className="flex gap-4"><span className="text-slate-500">[19:42:01]</span><span className="text-blue-400">[Intake-Agent]</span><span>Parsed form 183-C from client Maria Garcia. Extracted 14 entities.</span></div>
            <div className="flex gap-4"><span className="text-slate-500">[19:42:05]</span><span className="text-emerald-400">[Compliance-Sentinel]</span><span>Validation passed for entities in 183-C. No missing fields.</span></div>
            <div className="flex gap-4"><span className="text-slate-500">[19:45:10]</span><span className="text-amber-400">[Finance-Flow]</span><span>Generated Invoice INV-029. Syncing with Stripe...</span></div>
            <div className="flex gap-4"><span className="text-slate-500">[19:45:12]</span><span className="text-amber-400">[Finance-Flow]</span><span>Stripe sync complete. Status: Pending.</span></div>
            <div className="flex gap-4"><span className="text-slate-500">[19:46:00]</span><span className="text-purple-400">[Translator-Agent]</span><span>Processing structural translation for document ID-772...</span></div>
            <div className="flex gap-4"><span className="text-slate-500">[19:47:33]</span><span className="text-slate-300">[System]</span><span>Awaiting human approval on 1 pending item.</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-emerald-400">
            <span className="animate-pulse">_</span> listening for events...
          </div>
        </Card>
      )}
    </div>
  );
};
