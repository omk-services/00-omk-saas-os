// src/auth/AuthProvider.tsx
// Phase C — JWT-aware auth context. Reads 'org_id' + 'role' claims from Supabase session JWT.
// In saas mode, missing org_id → RLS will silently return 0 rows (warn per ADR-SUPABASE-001).

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase, SUPABASE_READY } from '@/lib/supabase';
import { APP_MODE } from '@/config/mode';
import type { AuthUser, Organization } from '@/lib/types';

export interface AuthContextValue {
  user: AuthUser | null;
  organization: Organization | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, orgName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtClaims(token: string): { org_id?: string; role?: string; sub?: string; email?: string } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return {
      org_id: payload.org_id ?? payload.app_metadata?.org_id,
      role: payload.role ?? payload.app_metadata?.role,
      sub: payload.sub,
      email: payload.email ?? payload.app_metadata?.email,
    };
  } catch {
    return {};
  }
}

async function fetchUserOrg(orgId: string): Promise<Organization | null> {
  if (!SUPABASE_READY) return null;
  const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).maybeSingle();
  if (error) {
    console.warn('[auth] failed to fetch organization', error.message);
    return null;
  }
  return data as Organization | null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (!SUPABASE_READY) {
      setIsLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setOrganization(null);
      setIsLoading(false);
      return;
    }
    const claims = decodeJwtClaims(session.access_token);
    const authUser: AuthUser = {
      id: claims.sub ?? session.user.id,
      email: claims.email ?? session.user.email ?? '',
      orgId: claims.org_id ?? null,
      role: claims.role ?? 'authenticated',
      isAuthenticated: true,
    };
    setUser(authUser);
    if (authUser.orgId) {
      const org = await fetchUserOrg(authUser.orgId);
      setOrganization(org);
    } else {
      setOrganization(null);
      if (APP_MODE === 'saas') {
        console.warn('[omk] saas mode but no org_id in JWT — RLS will return 0 rows');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void hydrate();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void hydrate();
    });
    return () => subscription.unsubscribe();
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!SUPABASE_READY) return { error: 'Supabase not configured (set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (_email: string, _password: string, _orgName: string) => {
    return { error: 'Organization provisioning requires HITL — see handoff notes. First sign in with a pre-provisioned account.' };
  }, []);

  const signOut = useCallback(async () => {
    if (SUPABASE_READY) await supabase.auth.signOut();
    setUser(null);
    setOrganization(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
