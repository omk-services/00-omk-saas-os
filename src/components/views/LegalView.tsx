import React from 'react';
import { Card } from '@/components/Card';
import { LegalDoc } from '@/lib/types';
import { FileText, File, CheckCircle, Clock, FileEdit, ShieldCheck, Lock, Download } from 'lucide-react';

const LEGAL_DOCS: ReadonlyArray<LegalDoc> = [
  { id: 'L1', title: 'NDA — TechFlow Industries', type: 'PDF', date: 'Oct 12, 2025', status: 'Signed', category: 'Client' },
  { id: 'L2', title: 'MSA — GreenScale Cooperative', type: 'DOCX', date: 'Oct 09, 2025', status: 'Pending', category: 'Client' },
  { id: 'L3', title: 'Freelance Contract — L. Martin', type: 'PDF', date: 'Sep 28, 2025', status: 'Signed', category: 'Freelance' },
  { id: 'L4', title: 'Articles of Incorporation', type: 'PDF', date: 'Sep 15, 2025', status: 'Signed', category: 'Corporate' },
  { id: 'L5', title: 'Data Processing Agreement (DPA)', type: 'DOCX', date: 'Aug 30, 2025', status: 'Draft', category: 'Corporate' }
];

const COMPLIANCE_SCORE = 100;

export const LegalView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Legal Data Room</h1>
          <p className="text-slate-500 text-sm mt-1">Secure repository for contracts and compliance.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-bold shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Encrypted Vault Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" /> Documents
              </h3>
              <span className="text-xs text-slate-500 font-medium">{LEGAL_DOCS.length} files stored</span>
            </div>
            <div className="divide-y divide-stone-100">
              {LEGAL_DOCS.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 px-6 flex items-center justify-between group hover:bg-emerald-50/30 transition-colors cursor-pointer"
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
                        <span className="text-xs text-slate-400">{doc.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {doc.status === 'Signed' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 mr-1.5" /> Signed
                      </span>
                    )}
                    {doc.status === 'Pending' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 mr-1.5" /> Pending
                      </span>
                    )}
                    {doc.status === 'Draft' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-slate-600 border border-stone-200">
                        <FileEdit className="w-3 h-3 mr-1.5" /> Draft
                      </span>
                    )}
                    <button className="text-slate-400 hover:text-emerald-600 transition-colors p-1">
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
    </div>
  );
};

export default LegalView;
