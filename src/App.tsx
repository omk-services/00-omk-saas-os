import React, { Suspense, useState, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShellLayout } from '@/components/ShellLayout';
import { useAuth } from '@/auth/useAuth';
import { LoginView } from '@/auth/LoginView';
import { SignupView } from '@/auth/SignupView';
import { ToastProvider } from '@/contexts/ToastContext';

// D6 #51 (2026-06-19): Lazy-load all views via React.lazy + Suspense. Splits the
// 573 KB single bundle into per-route chunks. Initial load drops to ~200 KB
// (only ShellLayout + App shell). Each route downloads on-demand.
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

const RouteFallback = (): React.ReactElement => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-400">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      <span className="text-sm">Loading…</span>
    </div>
  </div>
);

export default function App() {
  const { user, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'app' | 'login' | 'signup'>('app');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ⚠️ DEMO_MODE: temporary bypass to view dashboard without login.
  //    TODO: remove this flag before production deploy.
  const DEMO_MODE = true;

  if (!DEMO_MODE && isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!DEMO_MODE && !user) {
    if (authMode === 'signup') {
      return <SignupView onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginView onSwitchToSignup={() => setAuthMode('signup')} />;
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <ShellLayout
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
              />
            }
          >
            <Route index element={<Suspense fallback={<RouteFallback />}><DashboardView /></Suspense>} />
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
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}