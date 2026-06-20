// src/components/views/NotFoundView.tsx
// Phase E (2026-06-20) — 404 catch-all inside the protected shell.

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const location = useLocation();
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="p-4 bg-stone-50 rounded-full mb-6 text-slate-400">
          <Compass className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 max-w-md mb-6">
          The route <code className="px-2 py-1 bg-stone-100 rounded text-sm font-mono text-slate-700">{location.pathname}</code> doesn't exist or you don't have access to it.
        </p>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundView;