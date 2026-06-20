// src/components/ProtectedRoute.tsx
// ADR-OMK-005 (Phase E) — auth-gated route wrapper.
// Reads useAuth() + useOrg(). Redirects to /login if no session.
// Shows a "no org" banner inside the protected layout if saas mode but no org claim.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { useOrg } from '@/lib/tenant';
import { IS_SAAS } from '@/config/mode';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { orgId, isReady, isMissing } = useOrg();
  const location = useLocation();

  // While the auth session is being hydrated, show a minimal spinner.
  // Don't redirect yet — we don't know if the user is signed in.
  if (isLoading || !isReady) {
    return (
      <div
        className="min-h-screen bg-stone-50 flex items-center justify-center text-slate-500"
        role="status"
        aria-label="Authenticating"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm">Authenticating…</span>
        </div>
      </div>
    );
  }

  // No session → redirect to /login, preserving the intended destination.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Saas mode but no org claim → render children anyway (the view will show empty
  // state + warning). Better UX than infinite spinner.
  // D7 cost-of-escalation: a missing org is usually a hook wiring issue (D6 #64),
  // not a user error. We let the view render and surface the warning banner.
  if (IS_SAAS && isMissing && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `[ProtectedRoute] saas mode + no orgId at "${location.pathname}". ` +
        'The view will render but RLS queries return 0 rows. ' +
        'Check Supabase Auth dashboard → custom_access_token_hook wiring.',
    );
  }

  // Defensive: log a one-time marker so we can grep deploy logs for missing-org traffic.
  if (IS_SAAS && isMissing) {
    // eslint-disable-next-line no-console
    console.warn(`[omk] orgId missing at ${location.pathname}`);
  }

  return <>{children}</>;
};

export default ProtectedRoute;
