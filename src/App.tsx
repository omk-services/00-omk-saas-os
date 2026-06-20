import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShellLayout } from '@/components/ShellLayout';
import { useAuth } from '@/auth/useAuth';
import { LoginView } from '@/auth/LoginView';
import { SignupView } from '@/auth/SignupView';
import { ToastProvider } from '@/contexts/ToastContext';
import {
  DashboardView,
  ClientsView,
  ClientDetailView,
  DocumentsView,
  AgentsView,
  FinanceView,
  SOPLibraryView,
  SettingsView,
  PeopleView,
  TasksView,
  LegalView,
  GrowthView,
  SalesView,
  MarketplaceView,
  ItDataView
} from '@/components/views';

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
            <Route index element={<DashboardView />} />
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="clients" element={<ClientsView />} />
            <Route path="clients/:id" element={<ClientDetailView />} />
            <Route path="documents" element={<DocumentsView />} />
            <Route path="agents" element={<AgentsView />} />
            <Route path="finance" element={<FinanceView />} />
            <Route path="sop" element={<SOPLibraryView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="people" element={<PeopleView />} />
            <Route path="tasks" element={<TasksView />} />
            <Route path="legal" element={<LegalView />} />
            <Route path="growth" element={<GrowthView />} />
            <Route path="sales" element={<SalesView />} />
            <Route path="marketplace" element={<MarketplaceView />} />
            <Route path="it-data" element={<ItDataView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}