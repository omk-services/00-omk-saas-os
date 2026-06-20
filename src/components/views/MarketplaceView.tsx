// src/components/views/MarketplaceView.tsx
// Phase D (2026-06-20) — wraps catalog in ViewShell for consistent UX.
// NOTE: catalog is currently static. Phase D2 will wire to a `marketplace_items`
// table when productized add-ons are introduced (after customer onboarding validates
// the core SaaS flow).

import React from 'react';
import { Card } from '@/components/Card';
import { ViewShell } from '@/components/ViewShell';
import { CreditCard, Package, CheckCircle } from 'lucide-react';

const LISTINGS = [
  { id: 'MP1', title: 'Compliance Sentinel Pro', description: 'Automated RLS audit + multi-tenant security guardrails for SaaS deployments.', price: '€199/mo', category: 'Security' },
  { id: 'MP2', title: 'Translator Swarm', description: '50+ language pairs with human validation workflow and certified output.', price: '€349/mo', category: 'Translation' },
  { id: 'MP3', title: 'Stripe Reconcile+', description: 'Auto-reconcile Stripe payouts against your bookkeeper spreadsheets.', price: '€89/mo', category: 'Finance' },
  { id: 'MP4', title: 'Notion Sync Bridge', description: 'Two-way sync between your Notion workspace and the OMK database.', price: '€49/mo', category: 'Productivity' },
];

export const MarketplaceView: React.FC = () => {
  return (
    <ViewShell
      title="Upgrade Your OS"
      subtitle="Plug-and-play modules to scale your agency without adding headcount."
      loading={false}
      error={null}
      isEmpty={LISTINGS.length === 0}
      emptyTitle="No modules available yet"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {LISTINGS.map((item) => (
          <Card
            key={item.id}
            className="p-8 flex flex-col hover:border-emerald-200 hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-50 pointer-events-none" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 group-hover:bg-white group-hover:border-emerald-200 transition-colors">
                <Package className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
              </div>
              <span className="px-3 py-1 bg-stone-50 rounded-full text-xs font-bold text-slate-500 border border-stone-200 uppercase tracking-wide">
                {item.category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
            <p className="text-slate-500 text-sm mb-6 flex-1 leading-relaxed">{item.description}</p>
            <div className="flex items-center justify-between pt-6 border-t border-stone-100 mt-auto">
              <span className="text-2xl font-bold text-slate-900">{item.price}</span>
              <button className="flex items-center bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-emerald-600 transition-colors shadow-sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Activate
              </button>
            </div>
          </Card>
        ))}
      </div>
      <div className="border-t border-stone-200 pt-8 mt-8">
        <div className="flex justify-center items-center gap-2 text-sm text-slate-500">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>14-day money-back guarantee on all modules</span>
        </div>
      </div>
    </ViewShell>
  );
};

export default MarketplaceView;
