// src/components/views/mission-control/MissionDocsView.tsx
// Hermes — Docs sub-page (route /agent-root/docs)
// Static help/manual page describing the 8 Hermes Mission Control routes.

import { Hexagon } from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  body: string;
}

const SECTIONS: ReadonlyArray<DocSection> = [
  {
    id: 'overview',
    title: 'Overview · /agent-root',
    body:
      'The Mission Control hub. Live fleet stats: total tasks, average success rate, fast-routing percentage. Reads from omk_saas.agents and surfaces Hermes telemetry derived from agent status until the ingest pipeline is live.',
  },
  {
    id: 'agents',
    title: 'Agents · /agent-root/agents',
    body:
      'Full Agent configuration surface. One card per specialist with load, tokens, latency, channel, default model. Plus task summary (24h throughput) and model routing panel that lets the operator know which LLM each agent defaults to.',
  },
  {
    id: 'tasks',
    title: 'Tasks · /agent-root/tasks',
    body:
      'Kanban with three columns (To do / In progress / Done). Drag-and-drop powered by @dnd-kit. New-mission form, priority filter (P1/P2/P3), title search. Backed by the omk_saas.missions table (sql/08_hermes_missions.sql) with RLS by org_id.',
  },
  {
    id: 'office',
    title: 'Office · /agent-root/office',
    body:
      'A 3D city built by the agents. The orchestrator runs HQ at the center; four specialists own towers at the corners. Lit windows = live work. Drag to orbit, scroll to zoom, click a building to open its dossier with load, tasks, success rate, channel, and default model.',
  },
  {
    id: 'content',
    title: 'Content · /agent-root/content',
    body:
      'Document library. Reads omk_saas.documents. Title-scoped search. Stats strip showing total docs, agents writing, latest published. Each card opens the document via its fileUrl.',
  },
  {
    id: 'schedule',
    title: 'Schedule · /agent-root/schedule',
    body:
      'Weekly grid (Mon–Sun × 08:00–18:00 in 2-hour buckets). Mission density per cell, color-coded by priority. Cells aggregate missions by updated_at timestamp.',
  },
  {
    id: 'chat',
    title: 'Chat · /agent-root/chat',
    body:
      'Single-agent chat interface. Pick a specialist, type, get a reply. Replies are deterministic stubs that route by agent role (owner / manager / operator / viewer). The stub acknowledges wiring to a future Edge Function for live model replies.',
  },
  {
    id: 'docs',
    title: 'Docs · /agent-root/docs',
    body:
      'This page. The Mission Control manual — what each sub-route does, where the data comes from, and how to extend it. Maintained alongside the schema migrations in sql/.',
  },
];

export const MissionDocsView = (): React.ReactElement => {
  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-her-muted">
          <Hexagon className="size-3 text-ember" /> Mission Control Guide
        </div>
        <h1 className="font-display leading-[0.95] tracking-tight mt-2 text-ink" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
          Docs<span className="text-ember">.</span>
        </h1>
        <p className="font-sans text-[14px] text-her-muted mt-3 max-w-2xl">
          Eight surfaces wired to the OMK SaaS Dashboard. Each route reads from a single
          Supabase table, scoped by org_id through Row-Level Security.
        </p>
      </header>

      <nav aria-label="Documentation table of contents" className="rounded-3xl bg-cream border border-her-border p-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-her-muted">Table of contents</h2>
        <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[12px]">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block px-3 py-2 rounded-xl hover:bg-her-surface text-ink transition-colors">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <article key={s.id} id={s.id} className="rounded-3xl bg-her-surface border border-her-border p-6 scroll-mt-32">
            <h3 className="font-display text-[24px] text-ink">{s.title}</h3>
            <p className="font-sans text-[14px] text-ink/80 mt-3 leading-relaxed">{s.body}</p>
          </article>
        ))}
      </div>

      <footer className="rounded-3xl bg-ink text-cream p-6">
        <h3 className="font-display text-[20px]">Schema</h3>
        <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[12px]">
          <li className="rounded-2xl bg-cream/8 border border-cream/15 p-3">
            <code className="text-ember">sql/02_omk_saas_schema.sql</code>
            <p className="text-cream/65 mt-1">agents table — 8 columns, RLS by org_id.</p>
          </li>
          <li className="rounded-2xl bg-cream/8 border border-cream/15 p-3">
            <code className="text-ember">sql/07_hermes_agent_root.sql</code>
            <p className="text-cream/65 mt-1">9 nullable Hermes telemetry columns.</p>
          </li>
          <li className="rounded-2xl bg-cream/8 border border-cream/15 p-3">
            <code className="text-ember">sql/08_hermes_missions.sql</code>
            <p className="text-cream/65 mt-1">missions table — Kanban (todo/doing/done), RLS by org_id.</p>
          </li>
          <li className="rounded-2xl bg-cream/8 border border-cream/15 p-3">
            <code className="text-ember">sql/03_rls_policies.sql</code>
            <p className="text-cream/65 mt-1">RLS policies reused by all tenant tables.</p>
          </li>
        </ul>
      </footer>
    </div>
  );
};

export default MissionDocsView;
