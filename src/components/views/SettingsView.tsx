import React, { useState } from 'react';
import { Card } from '@/components/Card';

export const SettingsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('Profile');

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">System Roots (Settings)</h1>
        <p className="text-slate-500 text-sm mt-1">Manage global preferences and integrations</p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-stone-200 p-1 flex bg-stone-50">
          {['Profile', 'Company', 'Security', 'Integrations'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveSubTab(tab)}
              className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeSubTab === tab 
                  ? 'bg-white shadow-sm text-slate-900 border border-stone-200' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-stone-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="p-8 space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Personal Information</h3>
            <p className="text-sm text-slate-500 mb-6">Manage your profile details and preferences.</p>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold border-2 border-white shadow-md">
                AU
              </div>
              <div>
                <button className="bg-white border border-stone-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-stone-50 transition-colors mb-2">
                  Change Photo
                </button>
                <p className="text-xs text-slate-400">JPG, GIF or PNG. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">First Name</label>
                <input type="text" defaultValue="Admin" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Last Name</label>
                <input type="text" defaultValue="User" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input type="email" defaultValue="admin@omk.com" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <input type="text" defaultValue="+1 234 567 8900" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex justify-end">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
              Save Changes
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
