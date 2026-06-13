import React from 'react';
import { Card } from '@/components/Card';
import { Lead } from '@/lib/types';
import { MoreHorizontal, Plus, TrendingUp } from 'lucide-react';

const LEADS: ReadonlyArray<Lead> = [
  { id: 'GL1', name: 'TechFlow Industries', value: '€18k', status: 'Lead' },
  { id: 'GL2', name: 'Crimson Creative', value: '€12k', status: 'Lead' },
  { id: 'GL3', name: 'GreenScale Co-op', value: '€32k', status: 'In Discussion' },
  { id: 'GL4', name: 'Zenith SEO', value: '€8k', status: 'In Discussion' },
  { id: 'GL5', name: 'Alaric Chen LLC', value: '€24k', status: 'Won' }
];

interface ColumnProps {
  title: string;
  status: Lead['status'];
  leads: ReadonlyArray<Lead>;
  color: string;
}

const Column: React.FC<ColumnProps> = ({ title, status, leads, color }) => {
  const columnLeads = leads.filter((l) => l.status === status);
  const probability = status === 'Lead' ? '20%' : status === 'In Discussion' ? '60%' : '100%';
  return (
    <div className="flex-1 bg-white rounded-2xl border border-stone-200 flex flex-col">
      <div className={`p-4 border-b border-stone-200 flex justify-between items-center rounded-t-2xl ${color}`}>
        <h3 className="font-semibold text-sm tracking-wide text-slate-800">{title}</h3>
        <span className="text-xs bg-white px-2 py-0.5 rounded-lg text-slate-500 font-mono shadow-sm border border-stone-200">
          {columnLeads.length}
        </span>
      </div>
      <div className="p-3 space-y-3 flex-1">
        {columnLeads.map((lead) => (
          <div
            key={lead.id}
            className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-800 text-sm">{lead.name}</h4>
              <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-500">Prob. {probability}</span>
              <span className="text-sm font-bold text-emerald-700 font-mono">{lead.value}</span>
            </div>
          </div>
        ))}
        {columnLeads.length === 0 && (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-stone-200 rounded-xl text-slate-400 text-sm">
            Empty
          </div>
        )}
      </div>
    </div>
  );
};

export const GrowthView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Growth Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">Simple view. Move cards right.</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2">
            <span className="text-sm text-slate-500 mr-2">Total Pipeline:</span>
            <span className="text-lg font-bold text-emerald-700">€94k</span>
          </Card>
          <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pb-2">
        <Column title="Leads (Inbound)" status="Lead" leads={LEADS} color="bg-stone-50" />
        <Column title="In Discussion" status="In Discussion" leads={LEADS} color="bg-amber-50" />
        <Column title="Won (Signed)" status="Won" leads={LEADS} color="bg-emerald-50" />
      </div>

      <Card className="p-5 flex items-center gap-3 text-sm text-slate-600">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <span>
          Conversion rate: <span className="font-semibold text-slate-900">20%</span> · Avg deal size:{' '}
          <span className="font-semibold text-slate-900">€18.8k</span>
        </span>
      </Card>
    </div>
  );
};

export default GrowthView;
