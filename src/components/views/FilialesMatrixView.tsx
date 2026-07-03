// src/components/views/FilialesMatrixView.tsx
// Sidebar V2 — Filiales (per-ICP deploys) — topologie hybride §5.4 plan L2.
// D6 #NEW: route /filiales. Sister canon: plan-L2-business-os.md §5.4 + ADR-L2-AAAS-001.

import React from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import {
  Building, Briefcase, Scale, Stethoscope, Vault,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';

interface Filiale {
  id: string;
  name: string;
  icp: string;
  wave: '01' | '02' | 'sanctuary';
  ticket: string;
  status: 'live' | 'wip' | 'planned' | 'sanctuary';
  domainsLean: ReadonlyArray<string>;
  icon: React.ComponentType<{ className?: string }>;
}

const FILIALES: ReadonlyArray<Filiale> = [
  {
    id: 'coach',
    name: 'Coach Premium Filiale',
    icp: 'Executive & Leadership Coaching',
    wave: '01',
    ticket: '$1–1.5K/mo',
    status: 'live',
    domainsLean: ['Cyborg IT (Workflows)', 'GreenLantern People (SOP-Vault, Mémoire-Sync)'],
    icon: Sparkles,
  },
  {
    id: 'ec',
    name: 'Expert-Comptable Filiale',
    icp: 'Cabinets EC (3-10 associés)',
    wave: '02',
    ticket: '$750/mo',
    status: 'planned',
    domainsLean: ['Flash Product (Reconciliations)', 'WonderWoman Finance (Zero-PII Facturation)'],
    icon: Briefcase,
  },
  {
    id: 'avocat',
    name: 'Avocat Filiale',
    icp: 'Cabinets d\'avocats (5-20 associés)',
    wave: '02',
    ticket: '$1.5–2K/mo',
    status: 'planned',
    domainsLean: ['Aquaman Legal (AI-Act, Conflict-Scanner)'],
    icon: Scale,
  },
  {
    id: 'medical',
    name: 'Médical Filiale',
    icp: 'Cabinets médicaux (soins + admin)',
    wave: '02',
    ticket: '$1.5–2K/mo',
    status: 'planned',
    domainsLean: ['WonderWoman Finance (Health-Vault)', 'Aquaman Legal'],
    icon: Stethoscope,
  },
  {
    id: 'family-office',
    name: 'Family-Office Sanctuary',
    icp: 'Family Offices patrimoines baby-boomers',
    wave: 'sanctuary',
    ticket: '$5K–50K MRR',
    status: 'sanctuary',
    domainsLean: ['M. Manhunter Mémoire (Vault-Redactor)', 'Batman Ops (Vault-Audit)'],
    icon: Vault,
  },
];

const StatusBadge: React.FC<{ status: Filiale['status'] }> = ({ status }) => {
  const map = {
    live: { v: 'success' as const, label: '● Live' },
    wip: { v: 'warning' as const, label: '◐ WIP' },
    planned: { v: 'warning' as const, label: '○ Planned' },
    sanctuary: { v: 'success' as const, label: '◆ Sanctuary' },
  };
  return <Badge variant={map[status].v}>{map[status].label}</Badge>;
};

const WaveBadge: React.FC<{ wave: Filiale['wave'] }> = ({ wave }) => {
  const map = {
    '01': { v: 'success' as const, label: 'Wave 01' },
    '02': { v: 'warning' as const, label: 'Wave 02' },
    sanctuary: { v: 'success' as const, label: 'Sanctuary' },
  };
  return <Badge variant={map[wave].v}>{map[wave].label}</Badge>;
};

export const FilialesMatrixView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <BackButton />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Filiales — Holding Matrix</h1>
        <p className="text-slate-500 text-sm mt-1">
          5 templates per-ICP — topologie hybride §5.4 plan L2 — matrice lean par domaine Jerry
        </p>
      </div>

      {/* Rules */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600" />
          Doctrine d équilibre Holding ↔ Filiales
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 ml-6 list-disc">
          <li><strong>Summers</strong> ship la largeur (variants ICP = Filiales)</li>
          <li><strong>Jerry</strong> garantit la profondeur (chaque variant adossé à la bonne doctrine domaine)</li>
          <li>Holding = portfolio Summers (méta-persona-switcher)</li>
          <li>Filiale = variant Summers × sous-ensemble Jerry lean</li>
          <li>Domaines non-listés par Filiale = <strong>dormants</strong> (anti-paperclip, Posture C)</li>
        </ul>
      </div>

      {/* Filiales matrix */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">5 Templates Filiale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FILIALES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.id} className="p-5 hover:border-emerald-200 transition-all relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${f.status === 'live' ? 'bg-emerald-500' : f.status === 'sanctuary' ? 'bg-purple-500' : 'bg-amber-400'}`} />
                <div className="flex items-start justify-between mb-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 leading-tight">{f.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{f.icp}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <WaveBadge wave={f.wave} />
                  <StatusBadge status={f.status} />
                  <span className="ml-auto text-xs text-slate-500 font-mono">{f.ticket}</span>
                </div>
                <div className="pt-3 border-t border-stone-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Domaines Jerry activés (lean)
                  </p>
                  <ul className="space-y-1">
                    {f.domainsLean.map((d, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5">▸</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {f.status === 'live' ? 'Deployed Vercel · hold OMK omk-nexus-coaching-premium (W3 2026-07-03)' : 'Template · roadmap Q3 2026'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-slate-400 italic">
        Sister canon: <code className="text-emerald-600">plan-L2-business-os.md §5.4</code> + <code className="text-emerald-600">ADR-L2-AAAS-001</code>
      </p>
    </div>
  );
};

export default FilialesMatrixView;
