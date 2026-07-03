// src/components/views/OperationsKnowledgeView.tsx
// Sidebar V2 — Triptyque 1 CULTIVATE — fusion Documents + SOP Library.
// D6 #NEW: route /operations-knowledge. Old routes /documents + /sop keep working.
//
// Doctrine: Operations + Knowledge same workspace — SOPs (processes) + Documents (artefacts).
// Sister canon: sopsRepo (omk_saas.sops schema).

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { sopsRepo } from '@/data/sops.repo';
import { Sop } from '@/lib/types';
import { SOP_STATUS_LABEL } from '@/lib/statusLabels';
import { BookOpen, FileText, Plus, ExternalLink } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { safeArray } from '@/lib/safe';

export const OperationsKnowledgeView: React.FC = () => {
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sopsRepo.list()
      .then(setSops)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" role="status" aria-label="Loading">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700" role="alert">
        Error: {error}
      </div>
    );
  }

  const list = safeArray<Sop>(sops);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Operations & Knowledge</h1>
          <p className="text-slate-500 text-sm mt-1">
            Triptyque 1 — SOPs (processes) + Documents (artefacts) — {list.length} procedures loaded
          </p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Procedure
        </button>
      </div>

      {/* SOP Library */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Standard Operating Procedures (SOP Library)
        </h2>
        {list.length === 0 ? (
          <EmptyState title="No SOPs yet" description="Add your first procedure to start building institutional memory." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((sop) => {
              const status = sop.status ?? 'draft';
              return (
                <Card key={sop.id} className="p-5 hover:border-emerald-200 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate">{sop.title || '(untitled)'}</h3>
                        {sop.category && (
                          <p className="text-xs text-slate-500 mt-0.5">{sop.category}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={status === 'published' ? 'success' : 'warning'}>
                      {SOP_STATUS_LABEL[status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
                    <Link
                      to={`/sop`}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span className="ml-auto text-[10px] text-slate-400 font-mono">
                      {sop.id.slice(0, 8)}…
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Documents — placeholder shell, will connect to documents repo in W4 */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Documents Artefacts
        </h2>
        <Card className="p-6 text-center">
          <p className="text-sm text-slate-500">
            Documents module will be wired here in W4 (D6 backlog — connect to <code className="text-emerald-600">documentsRepo</code>).
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Legacy route <code className="text-emerald-600">/documents</code> remains live (D4 append-only).
          </p>
        </Card>
      </section>
    </div>
  );
};

export default OperationsKnowledgeView;
