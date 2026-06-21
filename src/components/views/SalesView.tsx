// src/components/views/SalesView.tsx
// Zero Bug Sprint — rewritten to fix double-mapping bug (D6 #100b).
//
// PREVIOUSLY: this view called salesLeadsRepo.list() and then re-normalized
// the already-mapped UI rows as if they were raw snake_case (read row.created_at,
// row.file_url, row.value). That worked by accident because the default
// mapper does NOT translate value, currency, file_url etc. — but the
// `date: row.created_at.substring(0,10)` line was reading from a mapped row.
//
// NOW: use the mapped fields directly (createdAt, value, currency).
// D6 #98: SaleLead.value is a string (PostgREST numeric). D6 #99: SaleLead.createdAt is full ISO.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { salesLeadsRepo } from '@/data/sales-leads.repo';
import { SaleLead } from '@/lib/types';
import { SALES_STAGE_LABEL } from '@/lib/statusLabels';
import { useOrg } from '@/lib/tenant';
import { TrendingUp, Clock, Euro, RefreshCw } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { formatMoney, safeArray, safeNum } from '@/lib/safe';

const STAGE_TO_TITLE: Readonly<Record<SaleLead['stage'], string>> = {
  Lead: 'Outreach',
  'In Discussion': 'Discovery',
  Won: 'Closed',
  Lost: 'Lost',
};

export const SalesView: React.FC = () => {
  const { isMissing } = useOrg();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs'>('pipeline');
  const [leads, setLeads] = useState<SaleLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((): void => {
    setLoading(true);
    setError(null);
    salesLeadsRepo
      .list()
      .then((rows) => {
        // rows are ALREADY mapped by the default mapper. Use them directly.
        setLeads(safeArray<SaleLead>(rows));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sales leads'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => safeArray<SaleLead>(leads), [leads]);

  const columns = useMemo(
    () =>
      (['Lead', 'In Discussion', 'Won', 'Lost'] as SaleLead['stage'][]).map((stage) => ({
        id: stage,
        title: STAGE_TO_TITLE[stage],
        items: list.filter((l) => l.stage === stage),
      })),
    [list],
  );

  // KPIs from real data.
  const totalRevenueLocked = list
    .filter((l) => l.stage === 'Won')
    .reduce((sum, l) => sum + safeNum(l.value, 0), 0);
  const wonCount = list.filter((l) => l.stage === 'Won').length;
  const closingRate = list.length > 0 ? Math.round((wonCount / list.length) * 100) : 0;
  const activeLeads = list.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Sales Sanctum</h1>
          <p className="text-slate-500 text-sm mt-1">Live pipeline from omk_saas.sales_leads</p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
          <p className="font-semibold">Error loading sales leads</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 h-24 bg-stone-50">{null}</Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Closing Rate</p>
            <div className="mt-3 flex items-baseline space-x-3">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{closingRate}%</h3>
              <span className="text-xs font-bold text-emerald-600">+live</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${closingRate}%` }} />
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Active Leads</p>
            <div className="mt-3 flex items-baseline space-x-3">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{activeLeads}</h3>
              <span className="text-xs font-bold text-slate-500">live</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden flex items-center text-[10px] text-slate-500 pl-2">
              <Clock className="w-3 h-3 inline mr-1" /> in pipeline
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Revenue Locked</p>
            <div className="mt-3 flex items-baseline space-x-3">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                {formatMoney(totalRevenueLocked)}
              </h3>
              <span className="text-xs font-bold text-slate-500">live</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden flex items-center text-[10px] text-slate-500 pl-2">
              <Euro className="w-3 h-3 inline mr-1" /> {wonCount} won
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'pipeline' ? (
        list.length === 0 ? (
          <EmptyState
            title="No sales leads yet"
            description="Add your first prospect to start the pipeline."
          />
        ) : (
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
                          {formatMoney(item.value, item.currency)} · {item.agency ?? 'no agency'}
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
        )
      ) : (
        <Card className="p-6">
          <p className="text-sm text-slate-500 italic">
            Agent logs (sales agent swarm) — D2 backlog. Currently no live log stream
            connected to omk_saas.sales_leads.
          </p>
        </Card>
      )}

      {/* Hint to confirm stage labels are wired */}
      <div className="text-xs text-slate-400 text-center pt-4 border-t border-stone-200">
        Stages: {(['Lead', 'In Discussion', 'Won', 'Lost'] as SaleLead['stage'][])
          .map((s) => SALES_STAGE_LABEL[s])
          .join(' · ')}
      </div>
    </div>
  );
};

export default SalesView;