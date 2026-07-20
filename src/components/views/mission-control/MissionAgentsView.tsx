// src/components/views/mission-control/MissionAgentsView.tsx
// Hermes — Agents sub-page (route /agent-root/agents)
// Extended version of the Overview agent grid with the full Hermes detail
// surface (orchestrator + 4 specialists, full task summary panel, model
// routing panel, recent fleet activity). Same data source (omk_saas.agents).

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Cpu,
  GitBranch,
  Hexagon,
  Sparkles,
  Zap,
} from 'lucide-react';
import { agentsRepo } from '@/data/agents.repo';
import type { Agent } from '@/lib/types';
import { AGENT_ROLE_LABEL } from '@/lib/statusLabels';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';
import { useHermesCards, stateAccent, type HermesAgentCard } from './useHermesCards';

const HeroChip = ({
  icon: Icon,
  value,
  label,
  accent = 'default',
}: {
  icon: typeof Activity;
  value: string;
  label: string;
  accent?: 'default' | 'ember';
}): React.ReactElement => (
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-full border border-cream/20 backdrop-blur-sm ${
      accent === 'ember' ? 'bg-ember text-cream' : 'bg-cream/10 text-cream'
    }`}
  >
    <Icon className="size-3 opacity-80" />
    <span className="font-display italic text-[18px] leading-none tabular-nums">{value}</span>
    <span className="font-mono text-[9px] uppercase tracking-wider opacity-80">{label}</span>
  </div>
);

const AgentCard = ({ card }: { card: HermesAgentCard }): React.ReactElement => {
  const accent = stateAccent[card.state];
  const loadColor =
    card.loadPct > 90 ? 'bg-rose-500' : card.loadPct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <article className="rounded-2xl bg-ink text-cream p-4 relative overflow-hidden border border-cream/10">
      <div className="absolute -right-12 -top-12 size-32 rounded-full bg-ember/20 blur-2xl" aria-hidden />
      <header className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-cream/8 border border-cream/15 grid place-items-center font-display italic text-[18px]">
            {card.initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/60">{card.code}</span>
              <span className={`size-1.5 rounded-full ${accent.dot}`} aria-hidden />
            </div>
            <h3 className="font-display text-[18px] leading-tight mt-0.5">{card.name}</h3>
            <p className="font-mono text-[10px] text-cream/55 tracking-wider uppercase">{card.role}</p>
          </div>
        </div>
        <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${accent.pill}`}>
          {accent.label}
        </span>
      </header>
      <p className="relative font-sans text-[12px] text-cream/70 mt-3 leading-snug line-clamp-2">{card.task}</p>
      <dl className="relative grid grid-cols-3 gap-2 mt-4 font-mono text-[10px] uppercase tracking-wider text-cream/55">
        <div>
          <dt>Load</dt>
          <dd className="text-cream text-[12px] tabular-nums mt-0.5">{card.loadPct}%</dd>
          <div className="mt-1 h-1 rounded-full bg-cream/10 overflow-hidden">
            <div className={`h-full ${loadColor}`} style={{ width: `${Math.min(100, card.loadPct)}%` }} />
          </div>
        </div>
        <div>
          <dt>Tokens</dt>
          <dd className="text-cream text-[12px] tabular-nums mt-0.5">{card.tokensToday}</dd>
        </div>
        <div>
          <dt>Latency</dt>
          <dd className="text-cream text-[12px] tabular-nums mt-0.5">{card.latency}</dd>
        </div>
      </dl>
      <footer className="relative mt-3 pt-3 border-t border-cream/10 flex items-center justify-between font-mono text-[10px]">
        <span className="text-cream/55 uppercase tracking-wider">{card.channel}</span>
        <span className="text-ember">{card.sharePct}% share</span>
      </footer>
    </article>
  );
};

export const MissionAgentsView = (): React.ReactElement => {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    agentsRepo
      .list()
      .then((rows) => { if (!cancelled) setAgents(rows); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load agents');
      });
    return () => { cancelled = true; };
  }, []);

  const cards = useHermesCards(agents);

  const stats = useMemo(() => {
    if (cards.length === 0) {
      return { agentCount: 0, activeCount: 0, avgSuccess: 0, totalTasksToday: 0, routedToFastPct: 0, distinctModels: 0 };
    }
    const activeCount = cards.filter((c) => c.state === 'EXECUTING' || c.state === 'THINKING').length;
    const totalTasks = cards.reduce((s, c) => s + c.tasksToday, 0);
    const avgSuccess = cards.reduce((s, c) => s + c.successPct, 0) / cards.length;
    const models = new Set(cards.map((c) => c.defaultModel));
    const routedFast = cards.filter((c) => c.defaultModel.includes('gemini') || c.defaultModel.includes('mini') || c.defaultModel.includes('haiku')).length;
    return {
      agentCount: cards.length,
      activeCount,
      avgSuccess,
      totalTasksToday: totalTasks,
      routedToFastPct: Math.round((routedFast / cards.length) * 100),
      distinctModels: models.size,
    };
  }, [cards]);

  if (error !== null) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading agents</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  if (agents === null) {
    return (
      <div className="space-y-4 animate-pulse" role="status">
        <div className="h-40 bg-stone-100 rounded-3xl" />
        <div className="h-64 bg-stone-100 rounded-2xl" />
      </div>
    );
  }
  if (cards.length === 0) {
    return <EmptyState title="No agents yet" description="Add an AI agent to populate the fleet." />;
  }

  return (
    <div className="space-y-5">
      <section className="relative rounded-3xl bg-ink text-cream px-7 md:px-9 py-7 md:py-8 overflow-hidden">
        <div className="absolute -top-24 -right-24 size-[260px] rounded-full bg-ember/20 blur-2xl" aria-hidden />
        <div className="absolute inset-0 opacity-30 dotgrid pointer-events-none" aria-hidden />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase text-cream/60">
              <Hexagon className="size-3 text-ember" /> Fleet · Configuration
            </div>
            <h1 className="font-display text-[44px] md:text-[60px] leading-[0.95] tracking-tight mt-3">
              {stats.agentCount} {stats.agentCount === 1 ? 'agent' : 'agents'}.<br />
              <span className="italic text-ember">one console.</span>
            </h1>
            <p className="font-sans text-[13px] text-cream/65 mt-3 max-w-lg">
              Inspect every specialist, route them to the right model, and watch the heartbeat
              of the entire fleet in one place. Live data from <code className="font-mono text-cream">omk_saas.agents</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeroChip icon={Activity} value={String(stats.totalTasksToday)} label="tasks logged" />
            <HeroChip icon={Sparkles} value={stats.avgSuccess === 0 ? '—' : `${stats.avgSuccess.toFixed(1)}`} label="avg success %" />
            <HeroChip icon={GitBranch} value={`${stats.routedToFastPct}%`} label="routed to fast" accent="ember" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-5">
        {cards.map((c) => <AgentCard key={c.id} card={c} />)}
      </section>

      <section className="grid grid-cols-12 gap-4 md:gap-5">
        <article className="col-span-12 lg:col-span-5 rounded-3xl bg-her-surface border border-her-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-her-muted">— TASK SUMMARY · LIVE</span>
              <p className="font-sans text-[13px] text-ink mt-1">Throughput across the fleet</p>
            </div>
            <button type="button" className="size-9 rounded-full bg-ink text-cream grid place-items-center hover:bg-ember transition-colors" aria-label="Open summary">
              <ArrowUpRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="rounded-2xl bg-ink text-cream p-5 relative overflow-hidden">
              <Zap className="absolute -right-4 -bottom-4 size-28 text-cream/10" strokeWidth={1} aria-hidden />
              <span className="font-mono text-[9px] tracking-widest opacity-70 uppercase">Active agents</span>
              <div className="font-display text-[56px] leading-[0.85] tabular-nums mt-2">{stats.activeCount}</div>
              <span className="font-mono text-[10px] text-ember mt-1 block">of {stats.agentCount} total</span>
            </div>
            <div className="rounded-2xl bg-cream border border-border p-5">
              <span className="font-mono text-[9px] tracking-widest text-her-muted uppercase">Avg success</span>
              <div className="font-display text-[56px] leading-[0.85] text-ink tabular-nums mt-2">
                {stats.avgSuccess === 0 ? '—' : stats.avgSuccess.toFixed(1)}
                <span className="text-[28px] text-her-muted">%</span>
              </div>
              <span className="font-mono text-[10px] text-her-muted mt-1 block">rolling fleet avg</span>
            </div>
          </div>
          <ul className="mt-5 space-y-2">
            {cards.map((c) => (
              <li key={`row-${c.id}`} className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-her-muted w-12">{c.code}</span>
                <span className="flex-1 font-sans text-[13px] text-ink truncate">{c.name}</span>
                <span className="font-mono text-[10px] tabular-nums text-her-muted w-14 text-right">{c.tasksToday} tasks</span>
                <span className="font-mono text-[10px] tabular-nums text-ink w-12 text-right">{c.successPct.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="col-span-12 lg:col-span-7 relative rounded-3xl bg-ember text-cream p-6 overflow-hidden">
          <div className="absolute -right-16 -top-16 size-[260px] rounded-full bg-cream/10 blur-2xl" aria-hidden />
          <Cpu className="absolute right-4 bottom-4 size-40 text-cream/10 -rotate-12" strokeWidth={1} aria-hidden />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-80">— MODEL ROUTING</span>
              <h2 className="font-display text-[36px] leading-[0.95] tracking-tight mt-2">
                Route each agent<br /><span className="italic">to its best brain.</span>
              </h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-cream/15 border border-cream/20 font-mono text-[10px] tracking-wider backdrop-blur-sm">
              {stats.agentCount} {stats.agentCount === 1 ? 'agent' : 'agents'} · {stats.distinctModels}{' '}
              {stats.distinctModels === 1 ? 'model' : 'models'}
            </span>
          </div>
          <ul className="relative mt-5 space-y-2">
            {cards.map((c) => (
              <li key={`model-${c.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cream/10 border border-cream/15 backdrop-blur-sm">
                <span className="size-6 rounded-md bg-cream/15 grid place-items-center font-mono text-[10px]">{c.initials}</span>
                <span className="font-sans text-[13px] truncate flex-1">{c.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">{c.role}</span>
                <span className="font-mono text-[11px] text-cream bg-ink/40 px-2 py-1 rounded">{c.defaultModel}</span>
              </li>
            ))}
          </ul>
          <p className="relative font-mono text-[10px] tracking-wider opacity-80 mt-4">
            changes apply on next dispatch · live from <code className="font-mono">omk_saas.agents</code>
          </p>
        </article>
      </section>
    </div>
  );
};

export default MissionAgentsView;
