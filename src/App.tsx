import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, Cpu, CreditCard, BookOpen, 
  Settings, Search, Bell, ChevronRight, Shield
} from 'lucide-react';
import { TabType } from '@/lib/types';
import { 
  DashboardView, ClientsView, DocumentsView, AgentsView, 
  FinanceView, SOPLibraryView, SettingsView 
} from '@/components/views';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const navGroups = [
    {
      title: 'CULTIVATE',
      links: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'finance', label: 'Finance', icon: CreditCard },
      ]
    },
    {
      title: 'NURTURE',
      links: [
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'sop', label: 'SOP Library', icon: BookOpen },
      ]
    },
    {
      title: 'BLOOM',
      links: [
        { id: 'agents', label: 'AI Agents Network', icon: Cpu },
      ]
    },
    {
      title: 'ROOTS',
      links: [
        { id: 'settings', label: 'System Roots', icon: Settings },
      ]
    }
  ] as const;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row text-slate-900 font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#FAFAF9] border-r border-stone-200 flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <Shield strokeWidth={2.5} className="w-6 h-6" />
             </div>
             <div>
                <h2 className="font-bold text-slate-900 tracking-tight leading-tight">OMK Services</h2>
                <span className="text-xs text-slate-500 font-medium tracking-wide relative -top-0.5">BUSINESS OS</span>
             </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold text-slate-400 tracking-widest px-3 mb-3 uppercase">{group.title}</h3>
              <div className="space-y-1">
                {group.links.map(link => {
                  const Icon = link.icon;
                  const isActive = activeTab === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => setActiveTab(link.id as TabType)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive 
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50' 
                        : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-200 m-4 mt-auto rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              AU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">admin@omk.com</p>
            </div>
          </div>
        </div>
      </aside>

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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
           </div>
        </header>

        {/* Dynamic View Injection */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'documents' && <DocumentsView />}
            {activeTab === 'agents' && <AgentsView />}
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'sop' && <SOPLibraryView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </div>
      </main>

    </div>
  );
}
