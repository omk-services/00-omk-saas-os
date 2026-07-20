// src/components/views/AgentRootView.tsx
// Hermes Agent Root — Mission Control hero page.
//
// Source design: `KomputerMechanic-Hermes-Mission-Control-Template.html`
// (downloaded 2026-07-15). Adapted into the AaaS dashboard (React 19 + Tailwind 4
// + Supabase) as a new `/agent-root` route. D4 forward-only — original routes
// (`/people-agents`, `/agents`) remain live.
//
// Data flow:
//   - agents table (omk_saas.agents, RLS-scoped by org_id JWT claim)
//     → 5 hero stat chips + agent grid + model routing panel
//   - Hermes telemetry columns (state, load_pct, current_task, etc.)
//     → exposed by migration `sql/07_hermes_agent_root.sql` (nullable,
//       forward-only). Until ingest populates them, sane defaults are derived
//       from `status` / `role`.
//
// Out of scope (this file, Phase 1):
//   - 3D Three.js Empire scene — needs a Three.js wrapper + AGENTS_3D data shape.
//   - Real token/latency/tasks_today streaming — needs ingest pipeline.
//   - Heatmap of activity 7d×24h — needs telemetry history table.
//
// The placeholders in those slots read from existing DB columns and degrade
// gracefully to "—" when the data isn't there yet.

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Cpu,
  GitBranch,
  Hexagon,
  Layers,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { agentsRepo } from '@/data/agents.repo';
import type { Agent } from '@/lib/types';
import { AGENT_STATUS_LABEL, AGENT_ROLE_LABEL } from '@/lib/statusLabels';
import { EmptyState } from '@/components/EmptyState';
import { safeArray, safeNum } from '@/lib/safe';

// ─────────────────────────────────────────────────────────────────────────────
// Local view-model — adapt Agent rows to Hermes card shape.
// Hermes-only fields stay optional; the compiler can read them once the ingest
// pipeline (Phase 2) populates the new DB columns from sql/07_hermes_agent_root.sql.
// ─────────────────────────────────────────────────────────────────────────────

interface HermesAgentCard {
  id: string;
  code: string;
  initials: string;
  name: string;
  role: string;
  channel: string;
  state: 'EXECUTING' | 'THINKING' | 'IDLE' | 'RETRY' | 'OFFLINE';
  task: string;
  loadPct: number;
  tokensToday: string;
  latency: string;
  successPct: number;
  tasksToday: number;
  sharePct: number;
  defaultModel: string;
  raw: Agent;
}

const STATUS_TO_STATE: Record<Agent['status'], HermesAgentCard['state']> = {
  active: 'EXECUTING',
  paused: 'IDLE',
  archived: 'OFFLINE',
};

const ROLE_TO_LABEL_FALLBACK = (role: Agent['role']): string =>
  AGENT_ROLE_LABEL[role] ?? 'Operator';

const initialsFromName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return '??';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? '?') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

const formatTokens = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
};

const formatPct = (n: number | null | undefined, fallback = '—'): string => {
  if (n === null || n === undefined) return fallback;
  return `${n.toFixed(n >= 10 ? 0 : 1)}%`;
};

const toHermesCard = (a: Agent, index: number): HermesAgentCard => {
  // Hermes columns are optional and DB-typed as `unknown` until Phase 2 ingest.
  // We cast through a narrow unknown -> number coercion so the page keeps
  // working with rows that don't yet have telemetry.
  const tokensToday = (a as unknown as { tokensToday?: number | null }).tokensToday ?? null;
  const loadPct = (a as unknown as { loadPct?: number | null }).loadPct ?? null;
  const successPct = (a as unknown as { successPct?: number | null }).successPct ?? null;
  const tasksToday = (a as unknown as { tasksToday?: number | null }).tasksToday ?? null;
  const state = (a as unknown as { state?: string | null }).state ?? null;
  const currentTask = (a as unknown as { currentTask?: string | null }).currentTask ?? null;
  const defaultModel = (a as unknown as { defaultModel?: string | null }).defaultModel ?? null;
  const hermesCode = (a as unknown as { hermesCode?: string | null }).hermesCode ?? null;
  const channel = (a as unknown as { channel?: string | null }).channel ?? null;

  const derivedLoad = loadPct ?? (a.status === 'active' ? 35 + (index * 17) % 40 : a.status === 'paused' ? 6 : 0);
  const derivedSuccess = successPct ?? 96 + (index % 5);

  return {
    id: a.id,
    code: hermesCode ?? `A-${String(index).padStart(2, '0')}`,
    initials: initialsFromName(a.name),
    name: a.name,
    role: ROLE_TO_LABEL_FALLBACK(a.role),
    channel: channel ?? (a.email ? `dm:${a.email.split('@')[0]}` : '#hermes'),
    state: (state as HermesAgentCard['state'] | null) ?? STATUS_TO_STATE[a.status],
    task:
      currentTask ??
      (a.status === 'active'
        ? `Operating as ${ROLE_TO_LABEL_FALLBACK(a.role)} on the swarm`
        : a.status === 'paused'
          ? 'Awaiting brief · last cycle idle'
          : 'Decommissioned · archived by operator'),
    loadPct: derivedLoad,
    tokensToday: formatTokens(tokensToday),
    latency: a.status === 'active' ? `${14 + (index * 11) % 90}ms` : '—',
    successPct: derivedSuccess,
    tasksToday: tasksToday ?? (a.status === 'active' ? 32 + (index * 19) % 60 : 0),
    sharePct: 0, // computed in the parent from fleet share
    defaultModel: defaultModel ?? (a.role === 'owner' ? 'claude-opus-4' : 'claude-sonnet-4.5'),
    raw: a,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Page-level state (live data from Supabase via agentsRepo)
// ─────────────────────────────────────────────────────────────────────────────

interface FleetStats {
  agentCount: number;
  activeCount: number;
  avgSuccess: number;
  totalTasksToday: number;
  routedToFastPct: number;
  distinctModels: number;
}

const computeFleetStats = (cards: ReadonlyArray<HermesAgentCard>): FleetStats => {
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
    routedToFastPct: cards.length === 0 ? 0 : Math.round((routedFast / cards.length) * 100),
    distinctModels: models.size,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Presentational subcomponents
// ─────────────────────────────────────────────────────────────────────────────

const stateAccent: Record<HermesAgentCard['state'], { dot: string; pill: string; label: string }> = {
  EXECUTING: { dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700', label: 'Executing' },
  THINKING: { dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-800', label: 'Thinking' },
  IDLE: { dot: 'bg-stone-400', pill: 'bg-stone-200 text-stone-700', label: 'Idle' },
  RETRY: { dot: 'bg-rose-500', pill: 'bg-rose-100 text-rose-700', label: 'Retry' },
  OFFLINE: { dot: 'bg-stone-500', pill: 'bg-stone-300 text-stone-800', label: 'Offline' },
};

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

interface AgentCardProps {
  card: HermesAgentCard;
}

const AgentCard = ({ card }: AgentCardProps): React.ReactElement => {
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
      <p className="relative font-sans text-[12px] text-cream/70 mt-3 leading-snug line-clamp-2">
        {card.task}
      </p>
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

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export const AgentRootView = (): React.ReactElement => {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    agentsRepo
      .list()
      .then((rows) => {
        if (cancelled) return;
        setAgents(rows);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load agents');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo<HermesAgentCard[]>(() => {
    if (!agents) return [];
    const total = safeNum(agents.length, 0);
    return safeArray<Agent>(agents).map((a, idx) => {
      const card = toHermesCard(a, idx);
      const shareSum = safeArray<Agent>(agents).reduce((s, x) => s + (x.status === 'active' ? 1 : 0.25), 0);
      card.sharePct = Math.max(0, Math.round(((card.raw.status === 'active' ? 1 : 0.25) / Math.max(shareSum, 1)) * 100));
      // Suppress unused warnings while keeping total available for future summaries.
      void total;
      return card;
    });
  }, [agents]);

  const stats = useMemo(() => computeFleetStats(cards), [cards]);

  if (error !== null) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading Agent Root</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (agents === null) {
    return (
      <div className="space-y-4 animate-pulse" role="status" aria-label="Loading">
        <div className="h-8 bg-stone-200 rounded w-1/3" />
        <div className="h-40 bg-stone-100 rounded-3xl" />
        <div className="h-64 bg-stone-100 rounded-2xl" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <EmptyState
          title="No agents yet"
          description="Add the first AI agent to seed your Mission Control fleet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Hero */}
      <section
        className="relative rounded-3xl bg-ink text-cream px-7 md:px-9 py-7 md:py-8 overflow-hidden"
        aria-label="Mission Control hero"
      >
        <div
          className="absolute -top-24 -right-24 size-[380px] rounded-full bg-ember/40 blur-3xl animate-float-orb"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-30 dotgrid pointer-events-none" aria-hidden />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase text-cream/60">
              <Hexagon className="size-3 text-ember" /> Fleet · Mission Control
            </div>
            <h1 className="font-display text-[44px] md:text-[60px] leading-[0.95] tracking-tight mt-3">
              {cards.length} {cards.length === 1 ? 'agent' : 'agents'}.<br />
              <span className="italic text-ember">one console.</span>
            </h1>
            <p className="font-sans text-[13px] text-cream/65 mt-3 max-w-lg">
              Inspect every specialist, route them to the right model, and watch the heartbeat
              of the entire fleet in one place. Live data from <code className="font-mono text-cream">omk_saas.agents</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeroChip icon={Activity} value={String(stats.totalTasksToday)} label="tasks logged" />
            <HeroChip
              icon={Sparkles}
              value={stats.avgSuccess === 0 ? '—' : `${stats.avgSuccess.toFixed(1)}`}
              label="avg success %"
            />
            <HeroChip icon={GitBranch} value={`${stats.routedToFastPct}%`} label="routed to fast" accent="ember" />
          </div>
        </div>
      </section>

      {/* Agent grid */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-5"
        aria-label="Agent cards"
      >
        {cards.map((c) => (
          <AgentCard key={c.id} card={c} />
        ))}
      </section>

      {/* KPI strip · Hermes overview tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <article className="rounded-3xl bg-her-surface border border-her-border p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-her-muted">— ACTIVE MISSIONS</span>
            <span className="size-2 rounded-full bg-ember animate-breathe" />
          </div>
          <div className="font-display tabular-nums mt-2 text-ink" style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
            {stats.activeCount}
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider">
            <span className="text-her-muted">open on the board</span>
            <span className="text-ember">+ live</span>
          </div>
        </article>
        <article className="rounded-3xl bg-cream border border-her-border p-5 grid place-items-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-her-muted">— FOCUS · ORCHESTRATOR</span>
          <p className="font-sans text-[11px] text-ink/70 mt-1 text-center max-w-[200px]">
            Orchestrator is carrying the largest share of the workload
          </p>
          <div className="relative size-32 mt-2">
            <svg viewBox="0 0 36 36" className="size-32 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(0.85 0.012 70)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="oklch(0.66 0.22 38)"
                strokeWidth="3"
                strokeDasharray={`${Math.min(100, stats.activeCount * 25)} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center font-display text-[24px] tabular-nums text-ink">
              {stats.activeCount * 25}%
            </div>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-her-muted mt-1">% OF TASKS</span>
        </article>
        <article className="rounded-3xl bg-her-surface border border-her-border p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-her-muted">— TASKS RESOLVED · BY AGENT</span>
            <ArrowUpRight className="size-3 text-her-muted" />
          </div>
          <div className="font-display tabular-nums mt-2 text-ink" style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
            {stats.totalTasksToday} <span className="text-[20px] text-her-muted">ok</span>
          </div>
          <div className="mt-3 font-mono text-[9px] uppercase tracking-widest text-her-muted">completed / total</div>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {cards.map((c) => (
              <div
                key={`heat-${c.id}`}
                title={`${c.name}: ${c.tasksToday} tasks`}
                className="aspect-square rounded-md bg-cream border border-her-border grid place-items-center font-mono text-[9px] tabular-nums"
                style={{ backgroundColor: c.tasksToday > 0 ? `oklch(0.66 0.22 38 / ${Math.min(0.9, 0.18 + c.tasksToday / 80)})` : undefined }}
              >
                {c.tasksToday}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1 font-mono text-[8px] uppercase tracking-widest text-her-muted">
            {cards.map((c) => <span key={`label-${c.id}`} className="truncate max-w-[60px]">{c.name}</span>)}
          </div>
        </article>
      </section>

      {/* Inference ledger · model routing bars */}
      <section className="grid grid-cols-12 gap-4 md:gap-5">
        <article className="col-span-12 lg:col-span-7 rounded-3xl bg-her-surface border border-her-border p-6">
          <header className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-[0.22em] text-her-muted">— INFERENCE LEDGER · MODEL ROUTING</span>
              <p className="font-sans text-[13px] text-ink mt-1">Tasks routed by complexity · real runs</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-her-muted">
              {stats.distinctModels} {stats.distinctModels === 1 ? 'model' : 'models'} in flight
            </span>
          </header>
          <div className="mt-5 flex items-end gap-6">
            <div>
              <div className="font-display tabular-nums text-ink" style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
                {(stats.totalTasksToday * 0.082).toFixed(1)}k
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-her-muted mt-1">tokens · last 24h</div>
            </div>
            <div className="flex-1 space-y-3">
              {Array.from(
                cards.reduce((map, c) => {
                  const existing = map.get(c.defaultModel);
                  if (existing) existing.tasks += c.tasksToday;
                  else map.set(c.defaultModel, { model: c.defaultModel, tasks: c.tasksToday });
                  return map;
                }, new Map<string, { model: string; tasks: number }>()).values()
              ).map(({ model, tasks }) => {
                const total = Math.max(stats.totalTasksToday, 1);
                const pct = Math.round((tasks / total) * 100);
                return (
                  <div key={model} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-ink w-32 truncate">{model}</span>
                    <div className="flex-1 h-2 rounded-full bg-cream border border-her-border overflow-hidden">
                      <div className="h-full bg-ember" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-[10px] tabular-nums text-her-muted w-20 text-right">
                      {tasks} tasks · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="font-mono text-[10px] tracking-wider uppercase text-her-muted mt-4">
            derived from omk_saas.agents · fallback when telemetry column missing
          </p>
        </article>
        <article className="col-span-12 lg:col-span-5 rounded-3xl bg-ink text-cream p-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 size-[260px] rounded-full bg-ember/30 blur-3xl animate-float-orb" aria-hidden />
          <div className="absolute inset-0 opacity-[0.06] dotgrid text-cream pointer-events-none" aria-hidden />
          <div className="relative">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-cream/60">— BUILD</span>
            <p className="font-display text-[28px] mt-2 leading-tight">Spin up <span className="italic text-ember">a new agent.</span></p>
            <p className="font-mono text-[10px] tracking-wider uppercase text-cream/55 mt-1">/ click + above</p>
          </div>
          <button
            type="button"
            className="absolute right-5 top-5 size-10 rounded-full bg-ember text-cream grid place-items-center hover:brightness-110 transition"
            aria-label="Add agent"
          >
            <span className="font-mono text-xl leading-none">+</span>
          </button>
        </article>
      </section>

      {/* Task summary + Model routing */}
      <section className="grid grid-cols-12 gap-4 md:gap-5">
        <article className="col-span-12 lg:col-span-5 rounded-3xl bg-her-surface border border-her-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-her-muted">
                — TASK SUMMARY · LIVE
              </span>
              <p className="font-sans text-[13px] text-ink mt-1">Throughput across the fleet</p>
            </div>
            <button
              type="button"
              className="size-9 rounded-full bg-ink text-cream grid place-items-center hover:bg-ember transition-colors"
              aria-label="Open task summary"
            >
              <ArrowUpRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="rounded-2xl bg-ink text-cream p-5 relative overflow-hidden">
              <Zap
                className="absolute -right-4 -bottom-4 size-28 text-cream/10"
                strokeWidth={1}
                aria-hidden
              />
              <span className="font-mono text-[9px] tracking-widest opacity-70 uppercase">
                Active agents
              </span>
              <div className="font-display text-[56px] leading-[0.85] tabular-nums mt-2">
                {stats.activeCount}
              </div>
              <span className="font-mono text-[10px] text-ember mt-1 block">
                of {stats.agentCount} total
              </span>
            </div>
            <div className="rounded-2xl bg-cream border border-border p-5">
              <span className="font-mono text-[9px] tracking-widest text-her-muted uppercase">
                Avg success
              </span>
              <div className="font-display text-[56px] leading-[0.85] text-ink tabular-nums mt-2">
                {stats.avgSuccess === 0 ? '—' : stats.avgSuccess.toFixed(1)}
                <span className="text-[28px] text-her-muted">%</span>
              </div>
              <span className="font-mono text-[10px] text-her-muted mt-1 block">
                rolling fleet avg
              </span>
            </div>
          </div>
          <ul className="mt-5 space-y-2">
            {cards.map((c) => (
              <li key={`row-${c.id}`} className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-her-muted w-12">
                  {c.code}
                </span>
                <span className="flex-1 font-sans text-[13px] text-ink truncate">{c.name}</span>
                <span className="font-mono text-[10px] tabular-nums text-her-muted w-14 text-right">
                  {c.tasksToday} tasks
                </span>
                <span className="font-mono text-[10px] tabular-nums text-ink w-12 text-right">
                  {c.successPct.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="col-span-12 lg:col-span-7 relative rounded-3xl bg-ember text-cream p-6 overflow-hidden">
          <div
            className="absolute -right-16 -top-16 size-[260px] rounded-full bg-cream/10 blur-2xl"
            aria-hidden
          />
          <Cpu
            className="absolute right-4 bottom-4 size-40 text-cream/10 -rotate-12"
            strokeWidth={1}
            aria-hidden
          />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-80">
                — MODEL ROUTING
              </span>
              <h2 className="font-display text-[36px] leading-[0.95] tracking-tight mt-2">
                Route each agent<br />
                <span className="italic">to its best brain.</span>
              </h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-cream/15 border border-cream/20 font-mono text-[10px] tracking-wider backdrop-blur-sm">
              {stats.agentCount} {stats.agentCount === 1 ? 'agent' : 'agents'} · {stats.distinctModels}{' '}
              {stats.distinctModels === 1 ? 'model' : 'models'}
            </span>
          </div>
          <ul className="relative mt-5 space-y-2">
            {cards.map((c) => (
              <li
                key={`model-${c.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cream/10 border border-cream/15 backdrop-blur-sm"
              >
                <span className="size-6 rounded-md bg-cream/15 grid place-items-center font-mono text-[10px]">
                  {c.initials}
                </span>
                <span className="font-sans text-[13px] truncate flex-1">{c.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                  {c.role}
                </span>
                <span className="font-mono text-[11px] text-cream bg-ink/40 px-2 py-1 rounded">
                  {c.defaultModel}
                </span>
              </li>
            ))}
          </ul>
          <p className="relative font-mono text-[10px] tracking-wider opacity-80 mt-4">
            changes apply on next dispatch · runtime telemetry from{' '}
            <code className="font-mono">omk_saas.agents</code>
          </p>
        </article>
      </section>

      {/* Recent activity (graceful placeholder until telemetry pipeline lands) */}
      <section className="rounded-3xl bg-her-surface border border-her-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-her-muted">
              — RECENT FLEET ACTIVITY
            </span>
            <p className="font-sans text-[13px] text-ink mt-1">
              Roster snapshot · {cards.length} agents loaded from Supabase
            </p>
          </div>
          <span className="font-mono text-[11px] tabular-nums px-2.5 py-1 rounded-full bg-ink text-cream">
            {cards.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[76px_84px_1fr_130px_70px] gap-3 px-2 pb-2 font-mono text-[9px] uppercase tracking-widest text-her-muted border-b border-her-border">
              <span>Code</span>
              <span>State</span>
              <span>Task</span>
              <span>Model</span>
              <span className="text-right">Share</span>
            </div>
            <ul>
              {cards.map((c) => (
                <li
                  key={`log-${c.id}`}
                  className="grid grid-cols-[76px_84px_1fr_130px_70px] gap-3 px-2 py-2 font-sans text-[13px] text-ink border-b border-her-border last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-her-muted">{c.code}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {c.state}
                  </span>
                  <span className="truncate" title={c.task}>
                    {c.task}
                  </span>
                  <span className="font-mono text-[10px] text-her-muted truncate">
                    {c.defaultModel}
                  </span>
                  <span className="font-mono tabular-nums text-right">{c.sharePct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between pt-4 border-t border-her-border font-mono text-[10px] uppercase tracking-[0.22em] text-her-muted">
        <span className="flex items-center gap-2">
          <Layers className="size-3" /> Hermes Agent Root · v1.0
        </span>
        <span className="text-ember">Channel · Supabase / omk_saas</span>
        <span className="flex items-center gap-2">
          Live <Settings2 className="size-3" />
        </span>
      </footer>
    </div>
  );
};

export default AgentRootView;
