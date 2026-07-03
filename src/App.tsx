// src/App.tsx
// Phase E (2026-06-20) — react-router-dom 7 wiring + ProtectedRoute + auth routes.
//
// D6 #51 (2026-06-19): Lazy-load all views via React.lazy + Suspense.
// D6 #72 (2026-06-20): Removed DEMO_MODE flag. Auth is now required for all
//   app routes. /login and /signup are public (no ShellLayout). 404 catch-all
//   for unknown routes. ProtectedRoute wraps every ShellLayout child.

import React, { Suspense, useState, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShellLayout } from '@/components/ShellLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginView } from '@/auth/LoginView';
import { SignupView } from '@/auth/SignupView';
import { ToastProvider } from '@/contexts/ToastContext';

// All 14 nav views lazy-loaded (D6 #51).
const DashboardView = lazy(() => import('@/components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const ClientsView = lazy(() => import('@/components/views/ClientsView').then(m => ({ default: m.ClientsView })));
const ClientDetailView = lazy(() => import('@/components/views/ClientDetailView').then(m => ({ default: m.ClientDetailView })));
const DocumentsView = lazy(() => import('@/components/views/DocumentsView').then(m => ({ default: m.DocumentsView })));
const AgentsView = lazy(() => import('@/components/views/AgentsView').then(m => ({ default: m.AgentsView })));
const FinanceView = lazy(() => import('@/components/views/FinanceView').then(m => ({ default: m.FinanceView })));
const SOPLibraryView = lazy(() => import('@/components/views/SOPLibraryView').then(m => ({ default: m.SOPLibraryView })));
const SettingsView = lazy(() => import('@/components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const PeopleView = lazy(() => import('@/components/views/PeopleView').then(m => ({ default: m.PeopleView })));
const TasksView = lazy(() => import('@/components/views/TasksView').then(m => ({ default: m.TasksView })));
const LegalView = lazy(() => import('@/components/views/LegalView').then(m => ({ default: m.LegalView })));
const GrowthView = lazy(() => import('@/components/views/GrowthView').then(m => ({ default: m.GrowthView })));
const SalesView = lazy(() => import('@/components/views/SalesView').then(m => ({ default: m.SalesView })));
const MarketplaceView = lazy(() => import('@/components/views/MarketplaceView').then(m => ({ default: m.MarketplaceView })));
const ItDataView = lazy(() => import('@/components/views/ItDataView').then(m => ({ default: m.ItDataView })));
const NotFoundView = lazy(() => import('@/components/views/NotFoundView').then(m => ({ default: m.NotFoundView })));

// Sidebar V2 — Triptyque 1+2+Duo fusion routes (2026-07-03 /people-agents, /operations-knowledge, /it-software-kernel, /product).
// D4 append-only: legacy routes /people, /agents, /documents, /sop, /it-data remain live.
const PeopleAgentsView = lazy(() => import('@/components/views/PeopleAgentsView').then(m => ({ default: m.PeopleAgentsView })));
const OperationsKnowledgeView = lazy(() => import('@/components/views/OperationsKnowledgeView').then(m => ({ default: m.OperationsKnowledgeView })));
const ItSoftwareKernelView = lazy(() => import('@/components/views/ItSoftwareKernelView').then(m => ({ default: m.ItSoftwareKernelView })));
const ProductView = lazy(() => import('@/components/views/ProductView').then(m => ({ default: m.ProductView })));
const FilialesMatrixView = lazy(() => import('@/components/views/FilialesMatrixView').then(m => ({ default: m.FilialesMatrixView })));

const RouteFallback = (): React.ReactElement => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-400">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      <span className="text-sm">Loading…</span>
    </div>
  </div>
);

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes — no shell, no auth required. */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/signup" element={<SignupView />} />

          {/* Protected app shell — all 14 nav items + 404. */}
          <Route
            element={
              <ProtectedRoute>
                <ShellLayout
                  sidebarCollapsed={sidebarCollapsed}
                  setSidebarCollapsed={setSidebarCollapsed}
                />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<RouteFallback />}><DashboardView /></Suspense>} />
            <Route path="clients" element={<Suspense fallback={<RouteFallback />}><ClientsView /></Suspense>} />
            <Route path="clients/:id" element={<Suspense fallback={<RouteFallback />}><ClientDetailView /></Suspense>} />
            <Route path="documents" element={<Suspense fallback={<RouteFallback />}><DocumentsView /></Suspense>} />
            <Route path="agents" element={<Suspense fallback={<RouteFallback />}><AgentsView /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<RouteFallback />}><FinanceView /></Suspense>} />
            <Route path="sop" element={<Suspense fallback={<RouteFallback />}><SOPLibraryView /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<RouteFallback />}><SettingsView /></Suspense>} />
            <Route path="people" element={<Suspense fallback={<RouteFallback />}><PeopleView /></Suspense>} />
            <Route path="tasks" element={<Suspense fallback={<RouteFallback />}><TasksView /></Suspense>} />
            <Route path="legal" element={<Suspense fallback={<RouteFallback />}><LegalView /></Suspense>} />
            <Route path="growth" element={<Suspense fallback={<RouteFallback />}><GrowthView /></Suspense>} />
            <Route path="sales" element={<Suspense fallback={<RouteFallback />}><SalesView /></Suspense>} />
            <Route path="marketplace" element={<Suspense fallback={<RouteFallback />}><MarketplaceView /></Suspense>} />
            <Route path="it-data" element={<Suspense fallback={<RouteFallback />}><ItDataView /></Suspense>} />

            {/* Sidebar V2 — Triptyque 1+2+Duo fusion routes (D4 append-only — legacy routes kept above). */}
            <Route path="people-agents" element={<Suspense fallback={<RouteFallback />}><PeopleAgentsView /></Suspense>} />
            <Route path="operations-knowledge" element={<Suspense fallback={<RouteFallback />}><OperationsKnowledgeView /></Suspense>} />
            <Route path="it-software-kernel" element={<Suspense fallback={<RouteFallback />}><ItSoftwareKernelView /></Suspense>} />
            <Route path="product" element={<Suspense fallback={<RouteFallback />}><ProductView /></Suspense>} />
            <Route path="filiales" element={<Suspense fallback={<RouteFallback />}><FilialesMatrixView /></Suspense>} />

            {/* 404 catch-all (D6 #73) — unknown routes inside the shell. */}
            <Route path="*" element={<Suspense fallback={<RouteFallback />}><NotFoundView /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
