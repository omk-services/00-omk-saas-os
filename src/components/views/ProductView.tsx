// src/components/views/ProductView.tsx
// Sidebar V2 — Triptyque 2 BLOOM — Product (angle mort avant V2, sister canon plan-L2 §13.4).
// D6 #NEW: route /product — Coach premium spearhead (omk-nexus-coaching-premium).
//
// Doctrine: Product = Business OS Niveau Produit (Holdings → Filiales par ICP).
// Sister canon: ADR-ICP-NEXUS-001 (Pilier 1-5) · ADR-L2-AAAS-001 (3 variants AaaS)
//                 · plan-L2-business-os.md §13.4 (Coach spearhead)
//                 · plan-minimax-l1-book-lune/03_guides-ld01-picard/PROPOSAL_omk-nexus-coaching-premium.md

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import {
  Rocket, Target, Layers, Shield, DollarSign, Award,
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';

interface Variant {
  id: string;
  name: string;
  icp: string;
  tier: string;
  pricing: string;
  status: 'live' | 'wip' | 'planned';
  pillars: number;
  description: string;
}

const VARIANTS: Variant[] = [
  {
    id: 'nexus',
    name: 'Nexus OMK · Coach premium',
    icp: 'Executive & Leadership Coaching',
    tier: '$7.5K–$25K one-shot + $750+/an recurring',
    status: 'live',
    pillars: 5,
    description: 'Spearhead canon. 3 guides YouTube distillés en context-spe Project Picard (lun. 2026-07-03). Zero-PII Agentic Governance en Pilier 5.',
  },
  {
    id: 'solaris',
    name: 'Solaris AaaS',
    icp: 'Life-OS-2026 / Solarpunk',
    tier: 'Tier 3: Sovereign Box Enterprise',
    status: 'live',
    pillars: 5,
    description: 'Référence d inspiration. Life-OS-2026 Vercel SHA b933e4e4. 8 B2 domaines × 8 B3 squads Marvel/DC.',
  },
  {
    id: 'orbiter',
    name: 'Orbiter ABC-OS',
    icp: 'Family Offices / Patrimoines baby-boomers',
    tier: '$5K–$50K MRR sanctuary',
    status: 'live',
    pillars: 5,
    description: 'Family-Office sanctuary. Vault-Redactor (Manhunter) + Vault-Audit (Batman). Cardinal book canon.',
  },
];

const VariantBadge: React.FC<{ status: Variant['status'] }> = ({ status }) => {
  const map = {
    live: { v: 'success' as const, label: '● Live' },
    wip:  { v: 'warning' as const, label: '◐ WIP' },
    planned: { v: 'warning' as const, label: '○ Planned' },
  };
  return <Badge variant={map[status].v}>{map[status].label}</Badge>;
};

const ICP_PILLARS = [
  { code: 'P1', label: 'Persona Expert méthodique' },
  { code: 'P2', label: 'Mantra "Data-First Conformité"' },
  { code: 'P3', label: 'Marché $84T (3-ICP lemma)' },
  { code: 'P4', label: 'JTBD/ICP spears' },
  { code: 'P5', label: 'Zero-PII Agentic Governance (5 mécanismes)' },
];

export const ProductView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <BackButton />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Product — AaaS Variants</h1>
        <p className="text-slate-500 text-sm mt-1">
          Triptyque 2 — Holding OMK Business OS expose 3 AaaS variants (Nexus / Solaris / Orbiter)
        </p>
      </div>

      {/* 5 Piliers canon — Anchor */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          5 Piliers canon (ADR-ICP-NEXUS-001 + ADR-L2-AAAS-001)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {ICP_PILLARS.map((p) => (
            <Card key={p.code} className="p-3 hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-mono text-xs font-bold text-slate-500">{p.code}</span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-snug">{p.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3 Variants AaaS */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-emerald-600" />
          3 Variants AaaS (ADR-L2-AAAS-001)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VARIANTS.map((v) => (
            <Card key={v.id} className="p-5 hover:border-emerald-200 transition-all relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${v.status === 'live' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <div className="flex items-start justify-between mb-3 mt-2">
                <h3 className="font-semibold text-slate-900 leading-tight pr-2">{v.name}</h3>
                <VariantBadge status={v.status} />
              </div>
              <p className="text-xs text-slate-500 italic mb-3">ICP: {v.icp}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-2 pt-2 border-t border-stone-100">
                <DollarSign className="w-3 h-3" />
                <span className="font-mono">{v.tier}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                <Award className="w-3 h-3" />
                <span>{v.pillars} piliers canon</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-3">{v.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Filiales link */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-emerald-600" />
          Holding → Filiales (matrice lean par ICP)
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          Roadmap Holding Nexus → Filiales topologie hybride (plan L2 §5.4). Chaque Filiale = deploy Vercel séparé, sous-ensemble lean de domaines B2 Jerry. Domaines non-listés = dormants (anti-paperclip, Posture C).
        </p>
        <Link
          to="/filiales"
          className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          Open Filiales Matrix →
        </Link>
      </section>
    </div>
  );
};

export default ProductView;
