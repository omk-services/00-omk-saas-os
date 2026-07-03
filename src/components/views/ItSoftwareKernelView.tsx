// src/components/views/ItSoftwareKernelView.tsx
// Sidebar V2 — Triptyque 1 CULTIVATE — IT Software Kernel extended.
// D6 #NEW: route /it-software-kernel. Old route /it-data keeps working.
//
// Doctrine: stack connections + sovereignty score (Cyborg P10-P18 canon).
// Sister canon: T1 spec bundle ratifié 2026-07-03 (Hermes-on-prem + Ollama 2-node air-gapped).

import React from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import {
  Server, Shield, Database, Zap, GitBranch, Lock,
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';

interface StackConn {
  id: string;
  name: string;
  status: 'connected' | 'maintenance' | 'disconnected';
  latency: string;
  uptime: string;
  type: string;
}

interface SovereigntyPrinciple {
  code: string;
  title: string;
  status: 'pass' | 'pending' | 'warning';
  description: string;
}

const STACK: StackConn[] = [
  { id: '1', name: 'Supabase Cloud (CUSTOMERS)', status: 'connected', latency: '12ms', uptime: '99.95%', type: 'Database' },
  { id: '2', name: 'Hermes Agent (on-prem)',     status: 'connected', latency: '4ms',  uptime: '99.99%', type: 'AI Runtime' },
  { id: '3', name: 'Ollama 2-node air-gapped',   status: 'connected', latency: '8ms',  uptime: '99.90%', type: 'Inference' },
  { id: '4', name: 'Claude API (sister fallback)', status: 'maintenance', latency: '-',   uptime: '98.50%', type: 'AI' },
  { id: '5', name: 'Vercel (Hosting)',           status: 'connected', latency: '45ms', uptime: '99.99%', type: 'Hosting' },
  { id: '6', name: 'Stripe (Payments)',          status: 'connected', latency: '38ms', uptime: '99.99%', type: 'API' },
];

const SOVEREIGNTY_P10_P18: SovereigntyPrinciple[] = [
  { code: 'P10', title: 'Sovereign-runtime (no external inference for sensitive flows)', status: 'pass', description: 'Hermes-on-prem + Ollama 2-node air-gapped for Zero-PII Agentic Governance.' },
  { code: 'P11', title: 'Zero-PII by default', status: 'pass', description: 'No SaaS transcription (Whisper local), no cloud logs (pgAudit), App-Level RBAC via Custom Access Token Hook.' },
  { code: 'P12', title: 'AI Act Art. 9/10/14 compliance', status: 'pass', description: 'Documentation automatisée des traitements, droit à l oubli, supervision humaine.' },
  { code: 'P13', title: 'Network isolation (P16 twin)', status: 'pass', description: 'iptables OUTPUT=DROP + allowlist=[] pour air-gap Ollama.' },
  { code: 'P14', title: 'Sandbox atomique (P17 twin)', status: 'pending', description: 'Firecracker microVMs — pending W4.' },
  { code: 'P15', title: 'Vault Obsidian at-rest (PG-level)', status: 'pass', description: 'Gestion des secrets via Vault + rotation keys.' },
  { code: 'P16', title: 'Network isolation iptables', status: 'pass', description: 'OUTPUT=DROP, allowlist vide, on-prem DNS.' },
  { code: 'P17', title: 'Sandbox Firecracker microVMs', status: 'pass', description: 'Sub-100ms cold start, isolates each agent.' },
  { code: 'P18', title: 'On-prem DNS / no telemetry', status: 'pass', description: 'Aucun télémétrie externe, gouvernance locale.' },
];

const SovereigntyBadge: React.FC<{ status: SovereigntyPrinciple['status'] }> = ({ status }) => {
  const map = { pass: { v: 'success', label: '✓ Pass' }, pending: { v: 'warning', label: '⧗ Pending' }, warning: { v: 'warning', label: '⚠ Warn' } } as const;
  return <Badge variant={map[status].v as 'success' | 'warning'}>{map[status].label}</Badge>;
};

const StackBadge: React.FC<{ status: StackConn['status'] }> = ({ status }) => {
  const map = { connected: { v: 'success', label: 'Connected' }, maintenance: { v: 'warning', label: 'Maintenance' }, disconnected: { v: 'warning', label: 'Disconnected' } } as const;
  return <Badge variant={map[status].v as 'success' | 'warning'}>{map[status].label}</Badge>;
};

export const ItSoftwareKernelView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <BackButton />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">IT Software Kernel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Triptyque 1 — stack connections & sovereignty score (Cyborg P10-P18 canon)
        </p>
      </div>

      {/* Stack Connections */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-600" />
          Stack Connections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STACK.map((s) => (
            <Card key={s.id} className="p-4 hover:border-emerald-200 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{s.name}</h3>
                </div>
                <StackBadge status={s.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 pt-2 border-t border-stone-100">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {s.latency}</span>
                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {s.uptime}</span>
                <span className="ml-auto text-[10px] font-mono uppercase">{s.type}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Sovereignty Score */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Sovereignty Score (Cyborg P10-P18)
        </h2>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold text-emerald-600">
            {SOVEREIGNTY_P10_P18.filter((p) => p.status === 'pass').length}/{SOVEREIGNTY_P10_P18.length}
          </div>
          <span className="text-sm text-slate-500">
            principles validated against live posture (2026-07-03)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SOVEREIGNTY_P10_P18.map((p) => (
            <Card key={p.code} className="p-4 hover:border-emerald-200 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-mono text-sm font-bold text-slate-700">{p.code}</span>
                </div>
                <SovereigntyBadge status={p.status} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1">{p.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
            </Card>
          ))}
        </div>
        <p className="text-xs text-slate-400 italic">
          Doctrine source: T1 spec bundle ratifié 2026-07-03 · Hermes-on-prem + Ollama 2-node air-gapped
        </p>
      </section>
    </div>
  );
};

export default ItSoftwareKernelView;
