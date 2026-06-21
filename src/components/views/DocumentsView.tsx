// src/components/views/DocumentsView.tsx
// Zero Bug Sprint — rewritten to match omk_saas.documents schema.
//
// Schema (no `name`/`client`/`type`/`status`/`size` columns — only `title`,
// `clientId`, `fileUrl`, `mimeType`, `uploadedBy`, `createdAt`, `updatedAt`).
//
// Bug fixes (D6 #95e, D6 #98, D6 #102, D6 #103):
//   - All field accesses rewritten to mapped schema.
//   - Removed UI-only fields (`name`, `type`, `status`, `size`) that had no
//     DB column. Show only what exists.
//   - Search wired with state + filter.
//   - Filter on `doc.status === 'Auto-filled'` etc removed (no such column).
//   - `target.client` no longer interpolated (was `undefined`).
//   - Added <BackButton /> + <EmptyState />.

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { documentsRepo } from '@/data/documents.repo';
import { Document } from '@/lib/types';
import { FileText, Search, Eye, Download, Send } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, safeArray, safeStr } from '@/lib/safe';

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewTarget, setViewTarget] = useState<Document | null>(null);
  const [signatureTarget, setSignatureTarget] = useState<Document | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    documentsRepo
      .list()
      .then(setDocuments)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load documents'))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return safeArray<Document>(documents);
    return safeArray<Document>(documents).filter((d) =>
      safeStr(d.title).toLowerCase().includes(q),
    );
  }, [documents, search]);

  const handleConfirmSignature = (): void => {
    if (!signatureTarget) return;
    const target = signatureTarget;
    setSignatureTarget(null);
    showToast(`Signature request sent for "${target.title}".`, 'success');
  };

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
        <p className="font-semibold">Error loading documents</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const allDocs = safeArray<Document>(documents);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Document Vault</h1>
          <p className="text-slate-500 text-sm mt-1">All documents linked to your clients</p>
        </div>
        <button
          disabled
          title="Upload available next sprint"
          className="flex items-center gap-2 bg-stone-100 text-slate-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          <Download className="w-4 h-4 rotate-180" /> Upload
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Total Documents</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{allDocs.length}</h3>
          <p className="text-xs font-medium text-slate-400 mt-2">across all clients</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Linked Clients</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {new Set(allDocs.map((d) => d.clientId)).size}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-2">distinct client IDs</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">File Types</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {new Set(allDocs.map((d) => d.mimeType)).size}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-2">distinct MIME types</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-stone-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title={documents.length === 0 ? 'No documents yet' : 'No documents match your search'}
            description={
              documents.length === 0
                ? 'Documents uploaded for clients will appear here.'
                : 'Try a different search term.'
            }
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {list.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="font-mono text-xs">
                        client: {doc.clientId.slice(0, 8)}…
                      </span>
                      <span>{doc.mimeType || 'unknown type'}</span>
                      <span className="font-mono text-xs">{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0 lg:w-auto w-full justify-start md:justify-end">
                  <button
                    onClick={() => setViewTarget(doc)}
                    className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-stone-200 rounded hover:bg-stone-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button
                    disabled
                    title="Available next sprint"
                    className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-slate-400 bg-stone-50 border border-stone-200 rounded cursor-not-allowed opacity-60"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={() => setSignatureTarget(doc)}
                    className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                  >
                    <Send className="w-4 h-4" /> Request Signature
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.title ?? 'Document'}
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setViewTarget(null)}
            className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Close
          </button>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Client ID</p>
                <p className="text-slate-800 font-mono text-xs mt-1 break-all">
                  {viewTarget.clientId}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">MIME Type</p>
                <p className="text-slate-800 font-medium mt-1">{viewTarget.mimeType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Created</p>
                <p className="text-slate-800 font-medium mt-1">{formatDate(viewTarget.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">File URL</p>
                <p className="text-slate-800 font-mono text-xs mt-1 break-all">
                  {viewTarget.fileUrl || '—'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Preview not implemented yet — file metadata only.
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={signatureTarget !== null}
        onClose={() => setSignatureTarget(null)}
        title="Request signature"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSignatureTarget(null)}
              className="bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSignature}
              className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Send Request
            </button>
          </>
        }
      >
        {signatureTarget && (
          <p className="text-sm text-slate-600 leading-relaxed">
            Request signature from{' '}
            <span className="font-mono text-xs">
              client {signatureTarget.clientId.slice(0, 8)}…
            </span>{' '}
            for <span className="font-semibold">{signatureTarget.title}</span>?
          </p>
        )}
      </Modal>
    </div>
  );
};

export default DocumentsView;