// src/components/BackButton.tsx
// Zero Bug Sprint (D6 #103) — Consistent "← Back" navigation for all non-root views.
//
// Each view that isn't /dashboard shows a BackButton at the top, so the user
// has an in-page navigation affordance independent of the Sidebar (which
// also provides navigation, but should not be the ONLY escape route).

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  /** Where to navigate. Defaults to '/dashboard'. */
  to?: string;
  /** Override label. Defaults to "Back". */
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ to = '/dashboard', label = 'Back' }) => {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
};

export default BackButton;