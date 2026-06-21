// src/components/ShellLayout.tsx
// Phase E — shared shell (Sidebar + Header + main) extracted from App.tsx.
// Renders the current route's outlet beneath the header. The breadcrumb reflects
// the deepest path segment so navigating to /clients/:id shows "Clients".

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ShellLayoutProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const PRETTY_LABELS: Record<string, string> = {
  '': 'Dashboard',
  dashboard: 'Dashboard',
  clients: 'Clients',
  documents: 'Knowledge',
  agents: 'AI Agents Network',
  finance: 'Finance',
  sop: 'SOP Library',
  settings: 'Settings',
  people: 'People',
  tasks: 'Tasks',
  legal: 'Legal',
  growth: 'Growth',
  sales: 'Sales Sanctum',
  marketplace: 'Marketplace',
  'it-data': 'IT & Data'
};

export const ShellLayout: React.FC<ShellLayoutProps> = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const topSegment = segments[0] ?? '';
  const isDetail = segments.length > 1;
  const breadcrumb = PRETTY_LABELS[topSegment] ?? topSegment.replace('-', ' ');

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row text-slate-900 font-sans">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main Content Area — md:pl-* prevents sidebar overlap (D6 lesson from 2a4f29e merged here) */}
      <main
        className={`flex-1 flex flex-col h-screen overflow-hidden bg-stone-50 transition-[padding] duration-300 ${
          sidebarCollapsed ? 'md:pl-28' : 'md:pl-72'
        }`}
      >
        <header className="h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 hidden md:flex sticky top-0">
          <div className="flex items-center text-sm font-medium text-slate-500">
            <span>Digital Garden</span>
            <ChevronRight className="w-4 h-4 mx-2 text-stone-300" />
            <span className="text-slate-900 capitalize">{breadcrumb}</span>
            {isDetail && (
              <>
                <ChevronRight className="w-4 h-4 mx-2 text-stone-300" />
                <span className="text-slate-500 font-mono text-xs">
                  {segments[segments.length - 1].slice(0, 8)}…
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Global search..."
                className="pl-9 pr-4 py-1.5 bg-stone-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all"
              />
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors bg-stone-100 rounded-full hover:bg-emerald-50"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {/* Zero Bug Sprint (D6 #95e): wrap the view Outlet in an ErrorBoundary
                so a view crash shows a friendly error UI + "Back to Dashboard"
                button, while the Sidebar (above) stays visible. */}
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};