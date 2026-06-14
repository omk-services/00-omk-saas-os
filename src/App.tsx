import React, { useState } from 'react';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { TabType } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/auth/useAuth';
import { LoginView } from '@/auth/LoginView';
import { SignupView } from '@/auth/SignupView';
import {
  DashboardView,
  ClientsView,
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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
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

  const renderView = (): React.ReactNode => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'clients':
        return <ClientsView />;
      case 'documents':
        return <DocumentsView />;
      case 'agents':
        return <AgentsView />;
      case 'finance':
        return <FinanceView />;
      case 'sop':
        return <SOPLibraryView />;
      case 'settings':
        return <SettingsView />;
      case 'people':
        return <PeopleView />;
      case 'tasks':
        return <TasksView />;
      case 'legal':
        return <LegalView />;
      case 'growth':
        return <GrowthView />;
      case 'sales':
        return <SalesView />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'it-data':
        return <ItDataView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row text-slate-900 font-sans">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-50">
        {/* Top Header */}
        <header className="h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 hidden md:flex sticky top-0">
          <div className="flex items-center text-sm font-medium text-slate-500">
            <span>Digital Garden</span>
            <ChevronRight className="w-4 h-4 mx-2 text-stone-300" />
            <span className="text-slate-900 capitalize">{activeTab.replace('-', ' ')}</span>
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
            <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors bg-stone-100 rounded-full hover:bg-emerald-50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* Dynamic View Injection */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">{renderView()}</div>
        </div>
      </main>
    </div>
  );
}
