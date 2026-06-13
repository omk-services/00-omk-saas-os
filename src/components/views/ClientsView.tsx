import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { clientsRepo } from '@/data/clients.repo';
import { Client } from '@/lib/types';
import { Search, Plus, Users, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    clientsRepo.list()
      .then(setClients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddClient = () => {
    const name = prompt("Enter client's full name:");
    const email = prompt("Enter client's email:");
    const service = prompt("Enter service (e.g., LLC Formation, Tax Consulting):");

    if (name && email && service) {
      const newClient: Client = {
        id: 'C' + (clients.length + 1),
        name,
        email,
        service,
        status: 'New Request',
        progress: 10,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      };
      void clientsRepo.create(newClient).then((c) => setClients((prev) => [...prev, c]));
    }
  };

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

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Case Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all your client files and cases</p>
        </div>
        <button 
          onClick={handleAddClient}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, icon: Users },
          { label: 'Active Cases', value: clients.filter(c => c.progress < 100).length, icon: Clock },
          { label: 'Completed', value: clients.filter(c => c.progress === 100).length, icon: CheckCircle },
          { label: 'New Requests', value: clients.filter(c => c.status === 'New Request').length, icon: AlertCircle },
        ].map((stat, i) => (
          <Card key={i} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg text-slate-400">
              <stat.icon className="w-5 h-5" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col">
        <div className="p-4 border-b border-stone-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search clients by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <button className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Service</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Progress</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs border border-emerald-200">
                        {client.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    <div className="flex items-center gap-2 mt-2">
                      <FileText className="w-4 h-4 text-slate-400" /> {client.service}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={
                      client.status === 'Validated' || client.status === 'Submitted' ? 'success' : 
                      client.status === 'Under Review' ? 'warning' :
                      client.status === 'New Request' ? 'danger' : 'info'
                    }>
                      {client.status}
                    </Badge>
                  </td>
                  <td className="p-4 w-48">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{client.progress}%</span>
                    </div>
                    <ProgressBar progress={client.progress} />
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors tooltip-trigger" title="View bottlenecks">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
