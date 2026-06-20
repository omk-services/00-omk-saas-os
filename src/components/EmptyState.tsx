// src/components/EmptyState.tsx
// Zero Bug Sprint (D6 #102) — Reusable empty state for views with 0 rows.
//
// Every view should render <EmptyState /> when its primary data array is empty
// (after loading completes and no error). Provides consistent UX across all 14
// views. Renders an icon, title, description, optional CTA.

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-white border border-dashed border-stone-200 rounded-lg">
      <div className="p-3 bg-stone-100 text-slate-400 rounded-full mb-3">
        {icon ?? <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;