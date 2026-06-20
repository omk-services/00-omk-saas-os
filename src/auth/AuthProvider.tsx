// src/auth/AuthProvider.tsx
// Phase C + F — JWT-aware auth context + Edge Function signUp onboarding.
// Reads 'org_id' + 'role' claims from Supabase session JWT (Phase A: custom_access_token_hook).
// In saas mode, missing org_id → RLS will silently return 0 rows (warn per ADR-SUPABASE-001).
// signUp() invokes the Edge Function `sign-up-organization` (Phase F) to atomically
// create auth.users + omk_saas.organizations + omk_saas.memberships in one request.

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase, SUPABASE_READY } from '@/lib/supabase';
import { APP_MODE } from '@/config/mode';
import { setActiveOrgIdCache } from '@/lib/tenant';
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
      // Phase II v3 (D6 #94 fix, 2026-06-20): the JWT top-level `role` claim is
      // hardcoded to 'authenticated' in public.custom_access_token_hook so that
      // PostgREST uses a real Postgres role (Supabase Cloud doesn't have an
      // 'owner' / 'admin' / 'member' / 'viewer' role). The actual membership
      // role string now lives in app_metadata.role — read that first for UI
      // display, fall back to top-level (legacy) only if app_metadata is absent.
      role: payload.app_metadata?.role ?? payload.role,
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
    if (import.meta.env.DEV) {
      console.warn('[auth] failed to fetch organization', error.message);
    }
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
    setActiveOrgIdCache(authUser.orgId);  // tenant.ts reads this for non-React code paths
    if (authUser.orgId) {
      const org = await fetchUserOrg(authUser.orgId);
      setOrganization(org);
    } else {
      setOrganization(null);
      if (APP_MODE === 'saas' && import.meta.env.DEV) {
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

  const signUp = useCallback(async (email: string, password: string, orgName: string) => {
    if (!SUPABASE_READY) {
      return { error: 'Supabase not configured (set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)' };
    }

    // 1. Create the auth.users row via Supabase Auth (email auto-confirmed in MVP).
    //    The Edge Function will detect the user already exists and skip re-creation.
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { org_name: orgName } },
    });
    if (signUpErr) {
      return { error: signUpErr.message };
    }
    if (!signUpData.user) {
      return { error: 'Sign-up succeeded but no user was returned.' };
    }

    // 2. Immediately sign in to obtain a JWT (needed to call the Edge Function
    //    when verify_jwt=true). In saas MVP, auto-confirm is enabled so this
    //    succeeds without email verification.
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      return { error: `User created but sign-in failed: ${signInErr.message}` };
    }

    // 3. Invoke the Edge Function to provision org + membership.
    //    The function uses service_role and bypasses RLS.
    const { data: fnData, error: fnErr } = await supabase.functions.invoke<{
      userId?: string;
      orgId?: string;
      orgSlug?: string;
      error?: string;
    }>('sign-up-organization', {
      body: {
        email,
        password,
        orgName,
        userId: signUpData.user.id,
      },
    });

    if (fnErr) {
      return { error: `Organization provisioning failed: ${fnErr.message}` };
    }
    if (!fnData || fnData.error) {
      return { error: fnData?.error ?? 'Edge Function returned no data.' };
    }

    // 4. Force a fresh session so the JWT custom_access_token_hook picks up the
    //    newly-created membership and injects the org_id claim.
    await supabase.auth.refreshSession();
    // Hydrate is triggered by onAuthStateChange listener set up in useEffect.

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (SUPABASE_READY) await supabase.auth.signOut();
    setUser(null);
    setOrganization(null);
    setActiveOrgIdCache(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
