// src/components/views/SettingsView.tsx
// Zero Bug Sprint — wired the previously-dead "Save Changes" button + added
// BackButton for navigation. Hardcoded defaults stay as placeholders until
// a real org-settings table is created (D2).

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { useToast } from '@/contexts/ToastContext';
import { useOrg } from '@/lib/tenant';
// Note: TenantContext exposes orgId / orgName / role but not the full user/org
// objects. We use those instead of {user, organization}.
import { BackButton } from '@/components/BackButton';
import { formatDate, safeStr } from '@/lib/safe';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
}

const initialForm = (): FormState => ({
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@omk.com',
  phone: '+1 234 567 8900',
  company: 'OMK Services',
});

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const { isAuthenticated, orgId } = useOrg();
  const [activeSubTab, setActiveSubTab] = useState('Profile');
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    // Simulate async save (no settings table yet — D2).
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    showToast('Settings saved (demo mode — no persistence yet).', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">System Roots (Settings)</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage global preferences and integrations
          {isAuthenticated ? <> · Org <span className="font-mono text-xs">{orgId?.slice(0, 8) ?? '—'}</span></> : null}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-stone-200 p-1 flex bg-stone-50">
          {(['Profile', 'Company', 'Security', 'Integrations'] as const).map((tab) => (
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
          {activeSubTab === 'Profile' && (
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Personal Information</h3>
              <p className="text-sm text-slate-500 mb-6">Manage your profile details and preferences.</p>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold border-2 border-white shadow-md">
                  AU
                </div>
                <div>
                  <button
                    onClick={() => showToast('Photo upload coming in D2.', 'info')}
                    className="bg-white border border-stone-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-stone-50 transition-colors mb-2"
                  >
                    Change Photo
                  </button>
                  <p className="text-xs text-slate-400">JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'Company' && (
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Company Information</h3>
              <p className="text-sm text-slate-500 mb-6">Organization-wide preferences.</p>
              <div className="space-y-1.5 max-w-md">
                <label className="text-sm font-medium text-slate-700">Company Name</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
                {orgId && (
                  <p className="text-xs text-slate-400 mt-1">
                    Org ID: <span className="font-mono">{orgId}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'Security' && (
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Security</h3>
              <p className="text-sm text-slate-500 mb-6">
                Two-factor authentication and session policies.
              </p>
              <p className="text-sm text-slate-400 italic">
                Security settings — D2 backlog (no settings table yet).
              </p>
            </div>
          )}

          {activeSubTab === 'Integrations' && (
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Integrations</h3>
              <p className="text-sm text-slate-500 mb-6">Connected services and API keys.</p>
              <p className="text-sm text-slate-400 italic">
                Integrations settings — D2 backlog (no settings table yet).
              </p>
            </div>
          )}

          <div className="pt-6 border-t border-stone-100 flex justify-end">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsView;