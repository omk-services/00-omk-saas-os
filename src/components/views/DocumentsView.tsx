import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { documentsRepo } from '@/data/documents.repo';
import { Document } from '@/lib/types';
import { FileText, FileCheck, Clock, BookOpen, Search, Users, Briefcase, Eye, Download, Send } from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<Document | null>(null);
  const [signatureTarget, setSignatureTarget] = useState<Document | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    documentsRepo
      .list()
      .then(setDocuments)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmSignature = (): void => {
    if (!signatureTarget) return;
    const target = signatureTarget;
    setSignatureTarget(null);
    showToast(`Signature request sent to ${target.client}.`, 'success');
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded"></div>
      </div>
    );
  }
  if (error) {
    return <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Document Vault</h1>
          <p className="text-slate-500 text-sm mt-1">Auto-filled documents with e-signature integration</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">
          <Download className="w-4 h-4 rotate-180" /> Upload
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: documents.length, icon: FileText },
          { label: 'Auto-Filled', value: documents.filter(d => d.status === 'Auto-filled').length, icon: FileCheck },
          { label: 'Pending Signature', value: documents.filter(d => d.status === 'Pending Signature').length, icon: Clock },
          { label: 'Templates', value: '12', icon: BookOpen },
        ].map((stat, i) => (
          <Card key={i} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg text-slate-400">
              <stat.icon className="w-5 h-5" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-stone-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {documents.map(doc => (
            <div key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-slate-900">{doc.name}</h4>
                    <Badge variant={
                      doc.status === 'Completed' ? 'success' :
                      doc.status === 'Auto-filled' ? 'info' :
                      doc.status === 'Under Review' ? 'warning' : 'danger'
                    }>{doc.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {doc.client}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {doc.type}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {doc.date}</span>
                    <span>{doc.size}</span>
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
                {doc.status !== 'Completed' && (
                  <button
                    onClick={() => setSignatureTarget(doc)}
                    className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                  >
                    <Send className="w-4 h-4" /> Request Signature
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.name ?? 'Document'}
        size="md"
        footer={
          <>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="bg-stone-50 text-slate-400 border border-stone-200 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-60 inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              type="button"
              onClick={() => setViewTarget(null)}
              className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Close
            </button>
          </>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Client</p>
                <p className="text-slate-800 font-medium mt-1">{viewTarget.client}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Category</p>
                <p className="text-slate-800 font-medium mt-1">{viewTarget.type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Size</p>
                <p className="text-slate-800 font-medium mt-1">{viewTarget.size}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Date</p>
                <p className="text-slate-800 font-medium mt-1">{viewTarget.date}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 font-semibold uppercase">Status</p>
                <p className="text-slate-800 font-medium mt-1">{viewTarget.status}</p>
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Preview not implemented yet — please Download to view the file content.
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
            Request signature from <span className="font-semibold">{signatureTarget.client}</span> for{' '}
            <span className="font-semibold">{signatureTarget.name}</span>?
          </p>
        )}
      </Modal>
    </div>
  );
};

export default DocumentsView;
