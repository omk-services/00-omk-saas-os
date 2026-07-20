// src/components/views/mission-control/MissionChatView.tsx
// Hermes — Chat sub-page (route /agent-root/chat)
// Single-agent chat. Select an agent, type, get a deterministic stub reply.
// Live wiring would route to an Edge Function — this is the UI shell.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Hexagon, MessageSquare, Send } from 'lucide-react';
import { agentsRepo } from '@/data/agents.repo';
import type { Agent } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';

interface ChatMessage {
  id: string;
  from: 'user' | 'agent';
  body: string;
  ts: string;
}

const AGENT_GREETING: Record<string, string> = {
  owner: 'Acknowledged. Routing request to the orchestrator layer.',
  manager: 'On it. Pulling the swarm status and getting back to you.',
  operator: 'Running. I will surface the result as soon as the loop completes.',
  viewer: 'Standing by. Watching the dashboard and flagging drift.',
};

const uid = (): string => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const MissionChatView = (): React.ReactElement => {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, ChatMessage[]>>({});
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    agentsRepo
      .list()
      .then((rows) => {
        if (cancelled) return;
        setAgents(rows);
        if (rows.length > 0 && !activeAgentId) setActiveAgentId(rows[0].id);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => { cancelled = true; };
  }, [activeAgentId]);

  const activeAgent = useMemo<Agent | null>(() => {
    if (!agents || !activeAgentId) return null;
    return safeArray<Agent>(agents).find((a) => a.id === activeAgentId) ?? null;
  }, [agents, activeAgentId]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messagesByAgent, activeAgentId]);

  const handleSend = (): void => {
    const body = draft.trim();
    if (!body || !activeAgentId) return;
    const userMsg: ChatMessage = { id: uid(), from: 'user', body, ts: new Date().toISOString() };
    setMessagesByAgent((prev) => ({
      ...prev,
      [activeAgentId]: [...(prev[activeAgentId] ?? []), userMsg],
    }));
    setDraft('');
    // Stub agent reply — deterministic per agent role.
    const reply = activeAgent
      ? `${AGENT_GREETING[activeAgent.role] ?? 'Received.'} (stub — wire to Edge Function for live replies)`
      : 'Received.';
    setTimeout(() => {
      setMessagesByAgent((prev) => ({
        ...prev,
        [activeAgentId!]: [
          ...(prev[activeAgentId!] ?? []),
          { id: uid(), from: 'agent', body: reply, ts: new Date().toISOString() },
        ],
      }));
    }, 350);
  };

  if (error !== null) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        <p className="font-semibold">Error loading chat</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  if (agents === null) {
    return <div className="space-y-4 animate-pulse"><div className="h-96 bg-stone-100 rounded-3xl" /></div>;
  }
  if (agents.length === 0) {
    return (
      <EmptyState
        title="No agents available"
        description="Add an agent to start a chat session."
        icon={<MessageSquare className="size-10 text-her-muted" />}
      />
    );
  }

  const messages = messagesByAgent[activeAgentId!] ?? [];

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-her-muted">
            <Hexagon className="size-3 text-ember" /> Talk to the fleet
          </div>
          <h1 className="font-display leading-[0.95] tracking-tight mt-2 text-ink" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
            Chat<span className="text-ember">.</span>
          </h1>
        </div>
      </header>

      <section className="grid grid-cols-12 gap-4 h-[640px]">
        <aside className="col-span-12 md:col-span-3 rounded-3xl bg-her-surface border border-her-border p-3 overflow-y-auto">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-her-muted px-2 py-1">Fleet · {agents.length}</div>
          <ul className="mt-1 space-y-1">
            {agents.map((a) => {
              const initials = a.name.split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() || '??';
              const isActive = a.id === activeAgentId;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setActiveAgentId(a.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-left transition-colors ${
                      isActive ? 'bg-ink text-cream' : 'hover:bg-cream'
                    }`}
                  >
                    <span className={`size-8 rounded-lg grid place-items-center font-display italic text-[14px] ${isActive ? 'bg-cream/15 text-cream' : 'bg-ink text-cream'}`}>
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`font-sans text-[13px] truncate ${isActive ? 'text-cream' : 'text-ink'}`}>{a.name}</div>
                      <div className={`font-mono text-[9px] uppercase tracking-wider ${isActive ? 'text-cream/65' : 'text-her-muted'}`}>{a.role}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className="col-span-12 md:col-span-9 rounded-3xl bg-ink text-cream border border-ink flex flex-col overflow-hidden">
          <header className="p-4 border-b border-cream/10 flex items-center gap-3">
            <span className="size-9 rounded-xl bg-cream/10 grid place-items-center font-display italic">
              {activeAgent ? activeAgent.name.slice(0, 2).toUpperCase() : '?'}
            </span>
            <div>
              <div className="font-display text-[18px]">{activeAgent?.name ?? '—'}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-cream/65">
                {activeAgent?.role ?? 'idle'} · {activeAgent?.email ?? ''}
              </div>
            </div>
          </header>

          <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full grid place-items-center text-cream/60 font-mono text-[11px] uppercase tracking-[0.22em]">
                Send a message to {activeAgent?.name ?? 'the agent'}…
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.from === 'user' ? 'bg-ember text-cream' : 'bg-cream/10 text-cream border border-cream/15'}`}>
                    <p className="font-sans text-[13px] leading-snug whitespace-pre-wrap">{m.body}</p>
                    <div className="font-mono text-[10px] uppercase tracking-wider opacity-70 mt-1">{formatTime(m.ts)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <footer className="p-3 border-t border-cream/10">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 px-3 h-12 rounded-full bg-cream/8 border border-cream/15"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${activeAgent?.name ?? ''}…`}
                aria-label={`Message ${activeAgent?.name ?? ''}`}
                className="flex-1 bg-transparent outline-none font-sans text-[13px] text-cream placeholder:text-cream/40"
              />
              <button type="submit" disabled={!draft.trim()} className="size-9 rounded-full bg-ember text-cream grid place-items-center hover:brightness-110 transition disabled:opacity-40">
                <Send className="size-4" />
              </button>
            </form>
          </footer>
        </article>
      </section>
    </div>
  );
};

export default MissionChatView;
