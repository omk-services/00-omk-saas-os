// supabase/functions/sign-up-organization/index.ts
// Phase F (2026-06-20) — atomic customer onboarding for OMK Tax Service SaaS.
//
// FLOW
//   1. Verify JWT (caller must be authenticated via signUp()'s auto-confirm flow OR
//      use the admin.createUser path for unconfirmed emails).
//   2. Parse { email, password, orgName, orgSlug? } from request body.
//   3. Use service_role to:
//        a. Create auth.users row (if not already created by client signUp)
//        b. Create omk_saas.organizations row (slug = orgSlug or auto-derived from orgName)
//        c. Create omk_saas.memberships row (user_id, org_id, role='owner')
//   4. Return { userId, orgId, orgSlug }.
//
// TENANT INVARIANTS
//   - The JWT custom_access_token_hook (Phase A) reads omk_saas.memberships to
//     inject org_id claim. Until this function completes, the user has no org.
//   - This function MUST be the only path that creates an organization. Direct
//     INSERTs from the client are blocked by RLS (FORCE ROW LEVEL SECURITY).
//
// SECURITY
//   - Function uses SUPABASE_SERVICE_ROLE_KEY (auto-injected by Edge Runtime).
//   - verify_jwt = true (default) — caller must present a valid JWT.
//   - For self-service signup, the client first calls supabase.auth.signUp() which
//     creates auth.users with email_confirmed_at=NULL. This Edge Function then
//     receives the caller's JWT (which has a valid signature but the email is
//     unconfirmed). We accept this trade-off: unconfirmed users CAN create orgs
//     (friction-free MVP), but the JWT will expire in 1h and they'll need to
//     confirm to refresh. To enforce email confirmation first, set
//     `supabase.auth.signUp({ options: { emailRedirectTo: ... } })` and gate
//     this Edge Function on email_confirmed_at — Phase F2.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2';

interface SignUpPayload {
  email: string;
  password: string;
  orgName: string;
  orgSlug?: string;
  userId?: string;  // optional — if client already created auth.users via signUp
}

// Slug regex matches the CHECK constraint on omk_saas.organizations.slug
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')  // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

Deno.serve(async (req: Request) => {
  // CORS preflight (the client SPA at omk-saas-os.vercel.app calls this).
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Parse + validate body.
  let payload: SignUpPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { email, password, orgName, orgSlug, userId } = payload;
  if (!email || !password || !orgName) {
    return jsonResponse({ error: 'Missing required fields: email, password, orgName' }, 400);
  }
  if (password.length < 8) {
    return jsonResponse({ error: 'Password must be at least 8 characters' }, 400);
  }

  // Derive slug from orgName if not provided.
  const slug = (orgSlug && SLUG_REGEX.test(orgSlug)) ? orgSlug : slugify(orgName);
  if (!SLUG_REGEX.test(slug)) {
    return jsonResponse(
      { error: 'Generated slug is invalid. Provide orgSlug matching ^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' },
      400,
    );
  }

  // Service-role client (bypasses RLS — the whole point of this function).
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    // 1. Resolve user_id (create if not provided).
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,  // MVP: auto-confirm. Phase F2: gate on email verification.
      });
      if (createErr) {
        return jsonResponse({ error: `Failed to create user: ${createErr.message}` }, 400);
      }
      resolvedUserId = created.user!.id;
    }

    // 2. Create organization.
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        plan: 'starter',
        status: 'active',
      })
      .select('id, slug, name, plan')
      .single();

    if (orgErr) {
      // Most common: slug already taken (unique constraint).
      if (orgErr.code === '23505') {
        return jsonResponse(
          { error: `Organization slug "${slug}" already taken. Choose another.` },
          409,
        );
      }
      return jsonResponse({ error: `Failed to create organization: ${orgErr.message}` }, 500);
    }

    // 3. Create membership (owner role).
    const { error: memberErr } = await admin
      .from('memberships')
      .insert({
        user_id: resolvedUserId,
        org_id: org.id,
        role: 'owner',
      });

    if (memberErr) {
      // Rollback: delete the org we just created.
      await admin.from('organizations').delete().eq('id', org.id);
      return jsonResponse({ error: `Failed to create membership: ${memberErr.message}` }, 500);
    }

    return jsonResponse({
      userId: resolvedUserId,
      orgId: org.id,
      orgSlug: org.slug,
      orgName: org.name,
      plan: org.plan,
    }, 200);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}