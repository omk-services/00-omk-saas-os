// src/components/ViewShell.tsx
// ADR-OMK-005 (Phase D) — standardized page shell for the 14 nav views.
//
// PURPOSE
//   Every view has the same 4 render states (loading / error / empty / ready).
//   Centralizing them here removes ~30 lines of boilerplate per view and
//   guarantees a consistent UX (same spinner style, same error banner,
//   same empty-state CTA across all views).
//
// USAGE
//   <ViewShell
//     title="Case Manager"
//     subtitle="Manage and track all your client files"
//     loading={loading}
//     error={error}
//     isEmpty={clients.length === 0}
//     emptyTitle="No clients yet"
//     emptyCta={{ label: 'New Client', onClick: openModal }}
//     onRetry={load}
//   >
//     <Card>{/* ready-state content */}</Card>
//   </ViewShell>

import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

interface EmptyCta {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface ViewShellProps {
  title: string;
  subtitle?: string;
  /** Right-side action area (e.g. "New Client" button). */
  actions?: React.ReactNode;
  loading: boolean;
  error: string | null;
  /** True when the data array is empty AND there's no error. Shows empty state. */
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyCta?: EmptyCta;
  /** Called when the user clicks "Retry" on the error state. */
  onRetry?: () => void;
  children: React.ReactNode;
}

export const ViewShell: React.FC<ViewShellProps> = ({
  title,
  subtitle,
  actions,
  loading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyCta,
  onRetry,
  children,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse" role="status" aria-label="Loading">
          <div className="h-8 bg-stone-200 rounded w-1/3"></div>
          <div className="h-32 bg-stone-100 rounded"></div>
          <span className="sr-only">Loading…</span>
        </div>
      )}

      {!loading && error && (
        <div
          className="p-6 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-rose-900">Error loading data</p>
              <p className="text-rose-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      )}

      {!loading && !error && isEmpty && (
        <div className="p-12 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-stone-50 rounded-full mb-4 text-slate-400">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{emptyTitle}</h3>
          {emptyDescription && <p className="text-slate-500 text-sm mt-1 max-w-md">{emptyDescription}</p>}
          {emptyCta && (
            <button
              type="button"
              onClick={emptyCta.onClick}
              className="mt-4 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
            >
              {emptyCta.icon}
              {emptyCta.label}
            </button>
          )}
        </div>
      )}

      {!loading && !error && !isEmpty && children}
    </div>
  );
};

export default ViewShell;
