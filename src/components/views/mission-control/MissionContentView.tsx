// src/components/views/mission-control/MissionContentView.tsx
// Hermes — Content sub-page (route /agent-root/content)
// Document library: stats strip + grid of recent documents from
// omk_saas.documents. Title-scoped search filter.

import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, FileText, Hexagon, Plus, Search } from 'lucide-react';
import { documentsRepo } from '@/data/documents.repo';
import { agentsRepo } from '@/data/agents.repo';
import type { Agent, Document } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const MissionContentView = (): React.ReactElement => {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([documentsRepo.list(), agentsRepo.list()])
      .then(([d, a]) => { if (!cancelled) { setDocuments(d); setAgents(safeArray<Agent>(a)); } })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo<Document[]>(() => {
    if (!documents) return [];
    const q = search.trim().toLowerCase();
    return safeArray<Document>(documents).filter((d) => q.length === 0 || d.title.toLowerCase().includes(q));
  }, [documents, search]);

  const agentIdsWriting = useMemo(() => {
    if (!documents) return 0;
    const set = new Set<string>();
    for (const d of safeArray<Document>(documents)) {
      if (d.uploadedBy) set.add(d.uploadedBy);
    }
    return set.size;
  }, [documents]);

  const latest = useMemo(() => {
    if (!documents || documents.length === 0) return null;
    return [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }, [documents]);

  if (error !== null) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading content</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  if (documents === null) {
    return <div className="space-y-4 animate-pulse"><div className="h-20 bg-stone-100 rounded-3xl" /></div>;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-her-muted">
            <Hexagon className="size-3 text-ember" /> AGENT OUTPUT
          </div>
          <h1 className="font-display leading-[0.95] tracking-tight mt-2 text-ink" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
            Library<span className="text-ember">.</span>
          </h1>
        </div>
        <button type="button" className="inline-flex items-center gap-2 px-4 h-11 rounded-2xl bg-her-surface border-l-2 border-ember text-ink font-mono text-[11px] tracking-wider uppercase hover:border-l-4 hover:bg-cream transition">
          <Plus className="size-3.5" /> New Doc
        </button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-her-surface border border-her-border border-t-2 border-t-ember p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-her-muted">Total Docs</div>
          <div className="font-display tabular-nums mt-1 text-ink" style={{ fontSize: 'clamp(24px, 2.4vw, 34px)' }}>
            {documents.length}
          </div>
        </div>
        <div className="rounded-3xl bg-her-surface border border-her-border border-t-2 border-t-ink p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-her-muted">Agents Writing</div>
          <div className="font-display tabular-nums mt-1 text-ink" style={{ fontSize: 'clamp(24px, 2.4vw, 34px)' }}>
            {agentIdsWriting} / {agents.length}
          </div>
        </div>
        <div className="rounded-3xl bg-her-surface border border-her-border border-t-2 border-t-ember p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-her-muted">Latest</div>
          <div className="font-sans text-[15px] text-ink truncate mt-1">
            {latest ? latest.title : '—'}
          </div>
          {latest && (
            <div className="font-mono text-[10px] text-her-muted mt-0.5">{formatDate(latest.createdAt)}</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-cream border border-her-border p-4">
        <label className="flex items-center gap-2 px-3.5 h-11 rounded-full bg-her-surface border border-her-border">
          <Search className="size-4 text-her-muted" strokeWidth={1.75} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title…"
            aria-label="Search documents"
            className="flex-1 bg-transparent outline-none font-sans text-[14px] text-ink placeholder:text-her-muted"
          />
        </label>
      </section>

      {documents.length === 0 ? (
        <EmptyState
          title="Library empty"
          description="No documents have been written yet. Agents will publish here as they work."
          icon={<BookOpenText className="size-10 text-her-muted" />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No match" description={`No documents match "${search}".`} />
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <article key={d.id} className="rounded-3xl bg-cream border border-her-border p-5 hover:shadow-soft transition-shadow">
              <header className="flex items-start gap-3">
                <FileText className="size-5 text-ember mt-0.5 shrink-0" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[18px] leading-tight text-ink truncate">{d.title}</h3>
                  <p className="font-mono text-[10px] text-her-muted uppercase tracking-wider mt-1">
                    {d.mimeType || 'untitled'} · {formatDate(d.createdAt)}
                  </p>
                </div>
              </header>
              <footer className="mt-4 pt-3 border-t border-her-border flex items-center justify-between font-mono text-[10px] text-her-muted">
                <span className="truncate">{d.uploadedBy ? `by ${d.uploadedBy.slice(0, 8)}…` : 'unattributed'}</span>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-ember hover:underline">Open →</a>
              </footer>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default MissionContentView;
