// src/components/views/mission-control/useHermesCards.ts
// Shared Agent → Hermes card mapper + types used by MissionOverviewView,
// MissionAgentsView and the Empire 3D scene. Keeps the derivation logic in
// one place so all sub-pages stay in sync.

import { useMemo } from 'react';
import type { Agent } from '@/lib/types';
import { AGENT_ROLE_LABEL } from '@/lib/statusLabels';
import { safeArray } from '@/lib/safe';

export type HermesState = 'EXECUTING' | 'THINKING' | 'IDLE' | 'RETRY' | 'OFFLINE';

export interface HermesAgentCard {
  id: string;
  code: string;
  initials: string;
  name: string;
  role: string;
  channel: string;
  state: HermesState;
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

const STATUS_TO_STATE: Record<Agent['status'], HermesState> = {
  active: 'EXECUTING',
  paused: 'IDLE',
  archived: 'OFFLINE',
};

export const stateAccent: Record<HermesState, { dot: string; pill: string; label: string }> = {
  EXECUTING: { dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700', label: 'Executing' },
  THINKING: { dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-800', label: 'Thinking' },
  IDLE: { dot: 'bg-stone-400', pill: 'bg-stone-200 text-stone-700', label: 'Idle' },
  RETRY: { dot: 'bg-rose-500', pill: 'bg-rose-100 text-rose-700', label: 'Retry' },
  OFFLINE: { dot: 'bg-stone-500', pill: 'bg-stone-300 text-stone-800', label: 'Offline' },
};

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

const toHermesCard = (a: Agent, index: number): HermesAgentCard => {
  const tokensToday = (a as unknown as { tokensToday?: number | null }).tokensToday ?? null;
  const loadPct = (a as unknown as { loadPct?: number | null }).loadPct ?? null;
  const successPct = (a as unknown as { successPct?: number | null }).successPct ?? null;
  const tasksToday = (a as unknown as { tasksToday?: number | null }).tasksToday ?? null;
  const state = (a as unknown as { state?: string | null }).state ?? null;
  const currentTask = (a as unknown as { currentTask?: string | null }).currentTask ?? null;
  const defaultModel = (a as unknown as { defaultModel?: string | null }).defaultModel ?? null;
  const hermesCode = (a as unknown as { hermesCode?: string | null }).hermesCode ?? null;
  const channel = (a as unknown as { channel?: string | null }).channel ?? null;

  return {
    id: a.id,
    code: hermesCode ?? `A-${String(index).padStart(2, '0')}`,
    initials: initialsFromName(a.name),
    name: a.name,
    role: AGENT_ROLE_LABEL[a.role] ?? 'Operator',
    channel: channel ?? (a.email ? `dm:${a.email.split('@')[0]}` : '#hermes'),
    state: (state as HermesState | null) ?? STATUS_TO_STATE[a.status],
    task:
      currentTask ??
      (a.status === 'active'
        ? `Operating as ${AGENT_ROLE_LABEL[a.role] ?? 'Operator'} on the swarm`
        : a.status === 'paused'
          ? 'Awaiting brief · last cycle idle'
          : 'Decommissioned · archived by operator'),
    loadPct: loadPct ?? (a.status === 'active' ? 35 + (index * 17) % 40 : a.status === 'paused' ? 6 : 0),
    tokensToday: formatTokens(tokensToday),
    latency: a.status === 'active' ? `${14 + (index * 11) % 90}ms` : '—',
    successPct: successPct ?? 96 + (index % 5),
    tasksToday: tasksToday ?? (a.status === 'active' ? 32 + (index * 19) % 60 : 0),
    sharePct: 0,
    defaultModel: defaultModel ?? (a.role === 'owner' ? 'claude-opus-4' : 'claude-sonnet-4.5'),
    raw: a,
  };
};

export const useHermesCards = (agents: Agent[] | null): HermesAgentCard[] =>
  useMemo<HermesAgentCard[]>(() => {
    if (!agents) return [];
    const list = safeArray<Agent>(agents);
    const shareSum = list.reduce((s, x) => s + (x.status === 'active' ? 1 : 0.25), 0) || 1;
    return list.map((a, idx) => {
      const card = toHermesCard(a, idx);
      card.sharePct = Math.max(0, Math.round(((a.status === 'active' ? 1 : 0.25) / shareSum) * 100));
      return card;
    });
  }, [agents]);
