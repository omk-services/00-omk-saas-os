// src/components/views/LegalView.tsx
// Phase D (2026-06-20) — wired to omk_saas.legal_docs repo.
// ADR-OMK-005 tenant-isolated.

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/Card';
import { ViewShell } from '@/components/ViewShell';
import { Badge } from '@/components/Badge';
import { legalDocsRepo, type LegalDocRow } from '@/data/legal-docs.repo';
import { useToast } from '@/contexts/ToastContext';
import { useOrg } from '@/lib/tenant';
import { FileText, File, CheckCircle, Clock, FileEdit, ShieldCheck, Lock, Download, Plus, RefreshCw } from 'lucide-react';

const COMPLIANCE_SCORE = 100;

const statusVariant = (s: LegalDocRow['status']): 'success' | 'warning' | 'default' => {
  if (s === 'Signed') return 'success';
  if (s === 'Pending') return 'warning';
  return 'default';
};

export const LegalView: React.FC = () => {
  const { isMissing } = useOrg();
  const { showToast } = useToast();
  const [docs, setDocs] = useState<LegalDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((): void => {
    setLoading(true);
    setError(null);
    legalDocsRepo
      .list()
      .then((rows) => {
        // Normalize DB rows → UI rows. Cloud returns snake_case columns.
        const normalized: LegalDocRow[] = rows.map((r: unknown) => {
          const row = r as Record<string, unknown>;
          return {
            id: String(row.id),
            title: String(row.title ?? ''),
            type: (row.type === 'PDF' || row.type === 'DOCX' ? row.type : 'PDF') as LegalDocRow['type'],
            category: (row.category === 'Client' || row.category === 'Freelance' || row.category === 'Corporate'
              ? row.category
              : 'Client') as LegalDocRow['category'],
            status: (row.status === 'Signed' || row.status === 'Pending' || row.status === 'Draft' || row.status === 'Archived'
              ? row.status
              : 'Pending') as LegalDocRow['status'],
            date: row.created_at ? String(row.created_at).substring(0, 10) : undefined,
            fileUrl: row.file_url ? String(row.file_url) : undefined,
            notes: row.notes ? String(row.notes) : undefined,
          };
        });
        setDocs(normalized);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load legal docs'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ViewShell
      title="Legal Data Room"
      subtitle="Secure repository for contracts and compliance."
      loading={loading}
      error={error}
      isEmpty={docs.length === 0}
      emptyTitle="No legal documents yet"
      emptyDescription="Upload your first contract or KBIS to get started."
      emptyCta={{
        label: 'Upload Document',
        onClick: () => showToast('Upload UI coming in Phase D2.', 'info'),
        icon: <Plus className="w-4 h-4" />,
      }}
      onRetry={load}
      actions={
        <>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {isMissing && (
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium">
              No orgId — tenant isolation inactive
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted Vault Active</span>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" /> Documents
              </h3>
              <span className="text-xs text-slate-500 font-medium">{docs.length} files stored</span>
            </div>
            <div className="divide-y divide-stone-100">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 px-6 flex items-center justify-between group hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        doc.type === 'PDF'
                          ? 'bg-red-50 border-red-100 text-red-500'
                          : 'bg-blue-50 border-blue-100 text-blue-500'
                      }`}
                    >
                      {doc.type === 'PDF' ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-800 transition-colors truncate">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-slate-500 border border-stone-200 uppercase tracking-wide font-medium">
                          {doc.category}
                        </span>
                        {doc.date && <span className="text-xs text-slate-400">{doc.date}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={statusVariant(doc.status)}>
                      {doc.status === 'Signed' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                      {doc.status === 'Pending' && <Clock className="w-3 h-3 mr-1.5" />}
                      {doc.status === 'Draft' && <FileEdit className="w-3 h-3 mr-1.5" />}
                      {doc.status}
                    </Badge>
                    <button className="text-slate-400 hover:text-emerald-600 transition-colors p-1" aria-label={`Download ${doc.title}`}>
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-stone-50 p-3 border-t border-stone-100 text-center">
              <button className="text-xs text-slate-500 hover:text-emerald-700 font-medium transition-colors">
                View Archived Documents
              </button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Compliance Score</h3>
            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-100" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="351.86"
                  strokeDashoffset={351.86 * (1 - COMPLIANCE_SCORE / 100)}
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-emerald-700">{COMPLIANCE_SCORE}%</span>
              </div>
            </div>
            <p className="text-sm text-slate-500">Your agency is fully compliant with current regulations.</p>
            <button className="mt-6 w-full py-2.5 bg-stone-50 border border-stone-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-sm font-bold transition-all shadow-sm">
              Run Audit
            </button>
          </Card>
        </div>
      </div>
    </ViewShell>
  );
};

export default LegalView;
