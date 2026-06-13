import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { sopsRepo } from '@/data/sops.repo';
import { Sop } from '@/lib/types';
import { BookOpen, PlayCircle, CheckCircle, FileCheck, Plus, Clock, Users } from 'lucide-react';

export const SOPLibraryView: React.FC = () => {
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sopsRepo.list()
      .then(setSops)
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
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">SOP Library</h1>
        <p className="text-slate-500 text-sm mt-1">Standardized procedures ensuring consistent quality across all services</p>
      </div>
      <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">
        <Plus className="w-4 h-4" /> New Procedure
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Master SOPs', value: sops.length, icon: BookOpen },
          { label: 'Total Executions', value: '1,217', icon: PlayCircle },
          { label: 'Avg Rating', value: '4.8', icon: CheckCircle },
          { label: 'Templates', value: '24', icon: FileCheck },
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sops.map(sop => (
        <Card key={sop.id} className="p-5 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <Badge variant="default">{sop.category}</Badge>
            <div className="flex items-center gap-1 text-amber-500 text-sm font-medium bg-amber-50 px-2 py-0.5 border border-amber-100 rounded">
              ★ {sop.rating}
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 text-lg mb-4 flex-1">{sop.title}</h3>
          
          <div className="grid grid-cols-3 gap-2 mt-auto mb-6">
            <div className="bg-stone-50 rounded p-2 text-center border border-stone-100">
              <span className="block text-xs text-slate-500 mb-1">Steps</span>
              <span className="font-semibold text-slate-900 text-sm">{sop.steps}</span>
            </div>
            <div className="bg-stone-50 rounded p-2 text-center border border-stone-100">
              <span className="block text-xs text-slate-500 mb-1">Avg Time</span>
              <span className="font-semibold text-slate-900 text-sm flex items-center justify-center gap-1"><Clock className="w-3 h-3 text-slate-400"/> {sop.time}</span>
            </div>
            <div className="bg-stone-50 rounded p-2 text-center border border-stone-100">
              <span className="block text-xs text-slate-500 mb-1">Uses</span>
              <span className="font-semibold text-slate-900 text-sm flex items-center justify-center gap-1"><Users className="w-3 h-3 text-slate-400"/> {sop.uses}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 border border-stone-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">
              Edit
            </button>
            <button className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
              Execute
            </button>
          </div>
        </Card>
      ))}
    </div>
  </div>
  );
};
