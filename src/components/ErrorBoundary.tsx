// src/components/ErrorBoundary.tsx
// Zero Bug Sprint (D6 #95e) — React error boundary for the protected shell.
//
// ANY uncaught exception in a view (render, useEffect, async data load that
// throws synchronously to render) is caught here. The Sidebar (sibling of
// <Outlet />) stays visible. The user gets a friendly error UI with two
// recovery buttons: "Back to Dashboard" + "Reload".
//
// In dev mode (import.meta.env.DEV), the full error is logged to console.error
// AND shown in the UI for debugging.
//
// Note: tsconfig.json sets `useDefineForClassFields: false`. We therefore
// initialize state in the constructor (not as a class field) to avoid the
// "Property 'state' does not exist on type 'ErrorBoundary'" error.

import React, { type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In dev, log the full stack + component tree for debugging.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="bg-white border border-rose-200 rounded-lg p-6 shadow-sm" role="alert">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-lg shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Something went wrong on this page</h2>
            <p className="text-sm text-slate-600 mt-1">
              An unexpected error occurred. Your data is safe. Use one of the buttons below to recover.
            </p>
            {isDev && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
                  Show error details (dev only)
                </summary>
                <pre className="mt-2 p-3 bg-slate-50 border border-stone-200 rounded text-rose-700 overflow-x-auto whitespace-pre-wrap">
{`${error.name}: ${error.message}\n${error.stack ?? ''}`}
                </pre>
              </details>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              this.reset();
              window.location.assign('/dashboard');
            }}
            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              this.reset();
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 bg-white border border-stone-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

/** Functional wrapper for use as a JSX element (avoids `new ErrorBoundary(...)` syntax). */
export const withErrorBoundary = (children: ReactNode): React.ReactElement => (
  <ErrorBoundary>{children}</ErrorBoundary>
);