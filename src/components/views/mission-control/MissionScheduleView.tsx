// src/components/views/mission-control/MissionScheduleView.tsx
// Hermes — Schedule sub-page (route /agent-root/schedule)
// Week schedule: 7-day grid showing mission density per agent. Lightweight
// server-free version — computes from existing omk_saas.missions + agents.

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Hexagon } from 'lucide-react';
import { missionsRepo } from '@/data/missions.repo';
import { agentsRepo } from '@/data/agents.repo';
import type { Agent, Mission } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';

const HOURS: ReadonlyArray<string> = ['08', '10', '12', '14', '16', '18'];
const DAYS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const PRIORITY_DOT: Record<string, string> = {
  P1: 'bg-rose-500',
  P2: 'bg-amber-500',
  P3: 'bg-stone-400',
};

const dayKey = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'mon';
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()] ?? 'mon';
};

const hourBucket = (iso: string): number => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const h = d.getHours();
  if (h < 8) return 0;
  if (h >= 18) return HOURS.length - 1;
  return Math.min(HOURS.length - 1, Math.floor((h - 8) / 2));
};

export const MissionScheduleView = (): React.ReactElement => {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([missionsRepo.list(), agentsRepo.list()])
      .then(([m, a]) => { if (!cancelled) { setMissions(m); setAgents(safeArray<Agent>(a)); } })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo<Record<string, Record<number, Mission[]>>>(() => {
    const base: Record<string, Record<number, Mission[]>> = {};
    for (const { key } of DAYS) base[key] = {};
    if (!missions) return base;
    for (const m of safeArray<Mission>(missions)) {
      const day = dayKey(m.updatedAt);
      const bucket = hourBucket(m.updatedAt);
      if (!base[day]) base[day] = {};
      if (!base[day][bucket]) base[day][bucket] = [];
      base[day][bucket].push(m);
    }
    return base;
  }, [missions]);

  if (error !== null) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading schedule</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  if (missions === null) {
    return <div className="space-y-4 animate-pulse"><div className="h-72 bg-stone-100 rounded-3xl" /></div>;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-her-muted">
            <Hexagon className="size-3 text-ember" /> Hermes Automation
          </div>
          <h1 className="font-display leading-[0.95] tracking-tight mt-2 text-ink" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
            Schedule<span className="text-ember">.</span>
          </h1>
          <p className="font-sans text-[13px] text-her-muted mt-2 max-w-xl">
            Mission density across the week. Click a chip to inspect.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-her-muted">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" /> P1</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" /> P2</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-stone-400" /> P3</span>
        </div>
      </header>

      {missions.length === 0 ? (
        <EmptyState
          title="Schedule empty"
          description="Add missions to populate the week grid."
          icon={<CalendarClock className="size-10 text-her-muted" />}
        />
      ) : (
        <section className="rounded-3xl bg-her-surface border border-her-border p-5 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left font-mono text-[9px] uppercase tracking-widest text-her-muted w-16">Hr</th>
                {DAYS.map((d) => (
                  <th key={d.key} className="text-center font-mono text-[10px] uppercase tracking-widest text-her-muted px-2">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour, hrIdx) => (
                <tr key={hour} className="border-t border-her-border">
                  <td className="py-3 font-mono text-[10px] text-her-muted">{hour}:00</td>
                  {DAYS.map((d) => {
                    const cell = grouped[d.key]?.[hrIdx] ?? [];
                    return (
                      <td key={`${d.key}-${hrIdx}`} className="py-3 px-1.5 align-top">
                        {cell.length === 0 ? (
                          <div className="h-12 rounded-xl border border-dashed border-her-border" />
                        ) : (
                          <div className="space-y-1">
                            {cell.slice(0, 3).map((m) => (
                              <div key={m.id} className="rounded-xl bg-cream border border-her-border p-2 flex items-center gap-2">
                                <span className={`size-1.5 rounded-full shrink-0 ${PRIORITY_DOT[m.priority] ?? 'bg-stone-400'}`} />
                                <span className="font-sans text-[11px] text-ink truncate flex-1" title={m.title}>{m.title}</span>
                              </div>
                            ))}
                            {cell.length > 3 && (
                              <div className="font-mono text-[10px] text-her-muted text-center">+{cell.length - 3} more</div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default MissionScheduleView;
