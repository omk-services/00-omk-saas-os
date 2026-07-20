// src/components/views/mission-control/MissionTasksView.tsx
// Hermes — Tasks sub-page (route /agent-root/tasks)
// Kanban with 3 columns (todo / doing / done), @dnd-kit drag-and-drop,
// new-mission form, search + priority filter, live data from
// omk_saas.missions (sql/08_hermes_missions.sql).

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Hexagon, Plus, Search, X } from 'lucide-react';
import { missionsRepo } from '@/data/missions.repo';
import { agentsRepo } from '@/data/agents.repo';
import type { Agent, Mission, MissionPriority, MissionStatus } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';

type Column = MissionStatus;

const COLUMN_LABELS: Record<Column, string> = {
  todo: 'To do',
  doing: 'In progress',
  done: 'Done',
};

const PRIORITY_COLORS: Record<MissionPriority, string> = {
  P1: 'bg-rose-100 text-rose-800 border-rose-200',
  P2: 'bg-amber-100 text-amber-800 border-amber-200',
  P3: 'bg-stone-100 text-stone-700 border-stone-200',
};

const COLUMN_ORDER: Column[] = ['todo', 'doing', 'done'];

const initialNewMission = (): { title: string; priority: MissionPriority; status: Column } => ({
  title: '',
  priority: 'P2',
  status: 'todo',
});

interface MissionCardProps {
  mission: Mission;
  agentById: Map<string, Agent>;
}

const MissionCard = ({ mission, agentById }: MissionCardProps): React.ReactElement => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mission.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const agent = mission.agentId ? agentById.get(mission.agentId) : null;
  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-2xl bg-cream border border-her-border p-4 cursor-grab active:cursor-grabbing hover:shadow-soft transition-shadow"
    >
      <header className="flex items-start justify-between gap-2">
        <h4 className="font-sans text-[14px] text-ink leading-tight flex-1">{mission.title}</h4>
        <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[mission.priority]}`}>
          {mission.priority}
        </span>
      </header>
      {mission.notes && (
        <p className="font-sans text-[12px] text-her-muted mt-2 line-clamp-2">{mission.notes}</p>
      )}
      <footer className="mt-3 pt-2 border-t border-her-border flex items-center justify-between font-mono text-[10px] text-her-muted">
        <span className="truncate">{agent ? agent.name : 'Unassigned'}</span>
        <span className="uppercase tracking-wider">{mission.id.slice(0, 6)}</span>
      </footer>
    </article>
  );
};

interface ColumnProps {
  column: Column;
  missions: Mission[];
  agentById: Map<string, Agent>;
}

const KanbanColumn = ({ column, missions, agentById }: ColumnProps): React.ReactElement => (
  <div className="rounded-3xl bg-her-surface/50 border border-her-border p-4 flex flex-col gap-3 min-h-[420px]">
    <header className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-her-muted">{COLUMN_LABELS[column]}</span>
      <span className="font-display text-[20px] tabular-nums text-ink">{missions.length}</span>
    </header>
    <SortableContext items={missions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-3 flex-1">
        {missions.length === 0 ? (
          <div className="flex-1 grid place-items-center text-her-muted font-mono text-[10px] uppercase tracking-wider border-2 border-dashed border-her-border rounded-2xl">
            Drop missions here
          </div>
        ) : (
          missions.map((m) => <MissionCard key={m.id} mission={m} agentById={agentById} />)
        )}
      </div>
    </SortableContext>
  </div>
);

export const MissionTasksView = (): React.ReactElement => {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<MissionPriority | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(initialNewMission());
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([missionsRepo.list(), agentsRepo.list()])
      .then(([m, a]) => { if (!cancelled) { setMissions(m); setAgents(safeArray<Agent>(a)); } })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => { cancelled = true; };
  }, []);

  const agentById = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents) map.set(a.id, a);
    return map;
  }, [agents]);

  const filtered = useMemo<Mission[]>(() => {
    if (!missions) return [];
    return safeArray<Mission>(missions).filter((m) => {
      const matchesSearch = search.trim().length === 0 || m.title.toLowerCase().includes(search.trim().toLowerCase());
      const matchesPriority = priorityFilter === 'all' || m.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [missions, search, priorityFilter]);

  const grouped = useMemo<Record<Column, Mission[]>>(() => {
    const base: Record<Column, Mission[]> = { todo: [], doing: [], done: [] };
    for (const m of filtered) base[m.status].push(m);
    for (const col of COLUMN_ORDER) base[col].sort((a, b) => a.position - b.position);
    return base;
  }, [filtered]);

  const counts = useMemo(() => {
    const list = missions ?? [];
    return {
      todo: list.filter((m) => m.status === 'todo').length,
      doing: list.filter((m) => m.status === 'doing').length,
      done: list.filter((m) => m.status === 'done').length,
    };
  }, [missions]);

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over || !missions) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find source and destination columns
    let sourceCol: Column | null = null;
    let targetCol: Column | null = null;
    for (const col of COLUMN_ORDER) {
      if (grouped[col].some((m) => m.id === activeId)) sourceCol = col;
      if (grouped[col].some((m) => m.id === overId)) targetCol = col;
    }
    // Drop on column body (over.id === column key)
    if (!targetCol && COLUMN_ORDER.includes(overId as Column)) targetCol = overId as Column;
    if (!sourceCol || !targetCol) return;

    if (sourceCol === targetCol) {
      const oldIndex = grouped[sourceCol].findIndex((m) => m.id === activeId);
      const newIndex = grouped[targetCol].findIndex((m) => m.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(grouped[sourceCol], oldIndex, newIndex);
      setMissions((prev) => {
        if (!prev) return prev;
        return prev.map((m) => {
          const idx = reordered.findIndex((r) => r.id === m.id);
          if (idx === -1) return m;
          return { ...m, status: targetCol!, position: idx };
        });
      });
      // Persist positions
      const mission = missions.find((m) => m.id === activeId);
      if (mission) {
        const idx = reordered.findIndex((r) => r.id === activeId);
        await missionsRepo.update(activeId, { position: idx }).catch(() => undefined);
      }
    } else {
      const moving = missions.find((m) => m.id === activeId);
      if (!moving) return;
      setMissions((prev) => {
        if (!prev) return prev;
        return prev.map((m) => (m.id === activeId ? { ...m, status: targetCol! } : m));
      });
      await missionsRepo.update(activeId, { status: targetCol }).catch(() => undefined);
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (!draft.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const position = grouped[draft.status].length;
      const created = await missionsRepo.create({
        title: draft.title.trim(),
        priority: draft.priority,
        status: draft.status,
        position,
        notes: null,
        agentId: null,
      });
      setMissions((prev) => [...(prev ?? []), created]);
      setDraft(initialNewMission());
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create mission');
    } finally {
      setSubmitting(false);
    }
  };

  if (error !== null) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading missions</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  if (missions === null) {
    return (
      <div className="space-y-4 animate-pulse" role="status">
        <div className="h-40 bg-stone-100 rounded-3xl" />
        <div className="grid grid-cols-3 gap-5"><div className="h-64 bg-stone-100 rounded-2xl" /><div className="h-64 bg-stone-100 rounded-2xl" /><div className="h-64 bg-stone-100 rounded-2xl" /></div>
      </div>
    );
  }
  if (missions.length === 0) {
    return (
      <div className="space-y-5">
        <EmptyState
          title="No missions yet"
          description="Capture your first mission to start the workflow."
          action={{ label: 'New mission', onClick: () => setShowForm(true) }}
        />
        {showForm && <NewMissionForm draft={draft} setDraft={setDraft} onCreate={handleCreate} onCancel={() => { setShowForm(false); setDraft(initialNewMission()); }} submitting={submitting} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-ink text-cream p-6 md:p-8">
        <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-ember/30 blur-3xl animate-float-orb" aria-hidden />
        <div className="pointer-events-none absolute inset-0 dotgrid text-cream/10" aria-hidden />
        <div className="relative flex flex-col lg:flex-row lg:items-end gap-6 justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-cream/60">
              <Hexagon className="size-3 text-ember" /> Mission Board · {missions.length} active
            </div>
            <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] mt-3 tracking-tight">
              Every mission, <span className="italic text-ember">in motion.</span>
            </h1>
            <p className="font-sans text-cream/70 mt-3 max-w-xl text-[14px]">
              Drag a card between columns to move it through your workflow. Captures what
              you're working on, sets priorities, and tracks it to done.
            </p>
          </div>
          <div className="flex gap-3">
            {COLUMN_ORDER.map((col) => (
              <div key={col} className="rounded-2xl bg-cream/5 border border-cream/10 px-4 py-3 backdrop-blur-sm">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/50">{COLUMN_LABELS[col]}</div>
                <div className="font-display text-[34px] leading-none mt-1 tabular-nums">{counts[col]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-6 flex flex-col md:flex-row md:items-center gap-3">
          <label className="flex items-center gap-2 px-3.5 h-10 rounded-full bg-cream/8 border border-cream/15 flex-1 max-w-md">
            <Search className="size-4 text-cream/60" strokeWidth={1.75} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search missions, IDs…"
              className="bg-transparent outline-none font-sans text-[13px] flex-1 placeholder:text-cream/40 text-cream"
              aria-label="Search missions"
            />
          </label>
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-cream/8 border border-cream/15" role="tablist" aria-label="Priority filter">
            {(['all', 'P1', 'P2', 'P3'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={priorityFilter === p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 h-8 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  priorityFilter === p ? 'bg-cream text-ink' : 'text-cream/70 hover:text-cream'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="ml-auto inline-flex items-center gap-2 px-4 h-10 rounded-full bg-ember text-cream font-mono text-[11px] tracking-wider uppercase hover:brightness-110 transition"
          >
            {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showForm ? 'Close' : 'New mission'}
          </button>
        </div>
      </section>

      {showForm && (
        <NewMissionForm draft={draft} setDraft={setDraft} onCreate={handleCreate} onCancel={() => { setShowForm(false); setDraft(initialNewMission()); }} submitting={submitting} />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {COLUMN_ORDER.map((col) => (
            <KanbanColumn key={col} column={col} missions={grouped[col]} agentById={agentById} />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

const NewMissionForm = ({
  draft,
  setDraft,
  onCreate,
  onCancel,
  submitting,
}: {
  draft: { title: string; priority: MissionPriority; status: Column };
  setDraft: (d: typeof draft) => void;
  onCreate: () => void;
  onCancel: () => void;
  submitting: boolean;
}): React.ReactElement => (
  <div className="rounded-3xl bg-her-surface border border-her-border p-4">
    <div className="flex flex-col md:flex-row gap-3 md:items-center">
      <input
        type="text"
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Mission title…"
        className="flex-1 px-4 h-11 rounded-2xl bg-cream border border-her-border outline-none font-sans text-[14px] text-ink placeholder:text-her-muted focus:border-ink/40"
        aria-label="Mission title"
        autoFocus
      />
      <select
        value={draft.priority}
        onChange={(e) => setDraft({ ...draft, priority: e.target.value as MissionPriority })}
        className="px-4 h-11 rounded-2xl bg-cream border border-her-border font-mono text-[12px] text-ink outline-none focus:border-ink/40"
        aria-label="Priority"
      >
        <option value="P1">P1 · Critical</option>
        <option value="P2" selected>P2 · High</option>
        <option value="P3">P3 · Normal</option>
      </select>
      <select
        value={draft.status}
        onChange={(e) => setDraft({ ...draft, status: e.target.value as Column })}
        className="px-4 h-11 rounded-2xl bg-cream border border-her-border font-mono text-[12px] text-ink outline-none focus:border-ink/40"
        aria-label="Column"
      >
        {COLUMN_ORDER.map((c) => <option key={c} value={c}>{COLUMN_LABELS[c]}</option>)}
      </select>
      <button
        type="button"
        onClick={onCreate}
        disabled={submitting || !draft.title.trim()}
        className="px-5 h-11 rounded-2xl bg-ember text-cream font-mono text-[11px] tracking-wider uppercase hover:brightness-110 transition disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 h-11 rounded-2xl bg-cream border border-her-border text-her-muted font-mono text-[11px] tracking-wider uppercase hover:text-ink transition"
      >
        Cancel
      </button>
    </div>
  </div>
);

export default MissionTasksView;
