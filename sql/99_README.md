# OMK Dashboard — SQL DDL Package

> **Status (2026-06-10)** : AWAITING ADR ratification. **Do not execute any of these files in the current session.**
> This package is a forward-looking draft prepared by a sub-agent (A3). It becomes executable only after the 4 ADR blockers listed below are resolved.

---

## Pre-requisite (ADDED 2026-06-11 — sub-agent #3, ADR-OMK-002)

Before any of the DDL files below can run, the **PG roles** `aspace_admin` and `aspace_observer` must exist on the VPS Supabase instance. They are provisioned by the file below, after `ADR-OMK-002` is ratified.

| # | File | Depends on | Purpose |
|---|------|-----------|---------|
| **0** | **`06_provision_pg_roles_omk.sql`** | — (run FIRST, before any DDL) | Creates `aspace_admin` (DDL+DML+GRANT, schema-strict `omk_internal` + `omk_saas`) and `aspace_observer` (SELECT-only, same schemas). Defense in depth: REVOKE ALL on `auth`/`storage`/`realtime`/`vault`/`pgsodium`/`extensions`/`supabase_functions`/`pgbouncer`/`graphql_public`. ADR: `_SPECS/ADR/ADR-OMK-002_pg-roles-provisionning.md`. Executor: A2 (Claude Code) HITL via `ssh srv941028 ...` after A0 sign-off. |

The DDL files below (`01_*.sql` → `05_*.sql`) contain **forward-looking GRANT blocks** that target `aspace_admin` / `aspace_observer` — they no-op until the roles are created by `06_provision_pg_roles_omk.sql`. This is the intent: **provision roles first, then apply DDL**, so the `GRANT` statements in 01-02 don't fail with "role does not exist".

---

## Order of execution

When the 4 blockers are cleared and Codex/Hermes is asked to deploy, run the files in this order. Each file is idempotent (`IF NOT EXISTS` / `DROP … IF EXISTS`) and depends only on files above it.

| # | File | Depends on | Purpose |
|---|------|-----------|---------|
| 1 | `01_omk_internal_schema.sql` | pgcrypto extension | Internal (single-tenant) schema + 5 business tables + grants |
| 2 | `02_omk_saas_schema.sql`     | pgcrypto extension | SaaS schema + `organizations` + `memberships` + 5 business tables with `org_id` + grants |
| 3 | `03_rls_policies.sql`        | 02 | Enable RLS on every saas business table + per-table tenant policies + service_role bypass |
| 4 | `04_jwt_hook.sql`            | 02 (reads `omk_saas.memberships`) | Custom Access Token Hook — injects `org_id` into every JWT |
| 5 | `05_seed_dev.sql`            | 01, 02, 03, 04 | DEV-only seed (1 org + 1 membership + 5 clients + 3 docs + 2 agents + 4 invoices + 3 sops) |
| — | `99_README.md`               | — | This file |

**Post-deploy step (HITL, dashboard):** wire `public.custom_access_token_hook` in Supabase Auth → Hooks → Custom Access Token. Restart the auth provider. Verify a decoded JWT contains `org_id` in `app_metadata`.

**Post-deploy step (HITL, VPS):** add `omk_internal,omk_saas` to `PGRST_DB_SCHEMAS` and restart `supabase-core` (per `ADR-SUPABASE-001` D7, see `apps/dashboard/REBUILD_WORKFLOW.md` §2 note).

**Pooler note (HITL, sub-agent 2026-06-11)**: Host port 5432 on the VPS is bound to `supabase-pooler` (Supavisor), **not** to `supabase-db` directly. As a result, `psql -h localhost -p 5432 -U postgres` fails with "Tenant or user not found" (the pooler requires a tenant name). The HITL executor must use one of these workarounds:
- `docker cp 06_provision_pg_roles_omk.sql srv941028:/tmp/ && ssh srv941028 "docker cp /tmp/06_provision_pg_roles_omk.sql supabase-db:/tmp/ && docker exec supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -f /tmp/06_provision_pg_roles_omk.sql -v section=apply"` (host `/tmp` is not visible inside containers; double `docker cp` is required).
- Or pipe the SQL via stdin: `cat 06_provision_pg_roles_omk.sql | ssh srv941028 "docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -v section=apply"`.

Sanity check was loosened in the script (l.38-44) to accept `supabase_admin` in addition to classic `rolsuper` roles.

---

## What this package is NOT

- **It is not a migration runner.** No `psql`, no `psql -f`, no `supabase db push`. The executor (Codex/Hermes via MCP `supabase-aspace` v0.1) will wrap each file with its own transaction + diff logic.
- **It is not authoritative.** The canonical contract is `apps/dashboard/REBUILD_WORKFLOW.md` §2. These drafts are **consistent with** that contract; if they ever drift, the workflow doc wins.
- **It is not the multi-tenant security boundary by itself.** RLS is the security boundary. The JWT hook is the **identity** boundary (where `org_id` comes from). Both must be wired for saas mode to work.
- **It is not production-ready yet.** Roles `aspace_admin` / `aspace_observer` don't exist on the VPS. The `GRANT` blocks in 01/02 are forward-looking — wrapped in `IF EXISTS (pg_roles)` so they no-op until the roles are created.

---

## 4 ADR blockers

| # | Blocker | Status |
|---|---------|--------|
| 1 | `ADR-SUPABASE-001` (multi-tenant Supabase) | ✅ ACCEPTED 2026-06-08 in `_SPECS/ADR/` |
| 2 | PG roles `aspace_admin` / `aspace_observer` on VPS | ✅ RATIFIED 2026-06-11 — ADR-OMK-002 + script 06_provision_pg_roles_omk.sql prêt (HITL VPS via SSH srv941028) |
| 3 | MCP `supabase-aspace` v0.1 | 🟡 ADR-OMK-003 en rédaction (sub-agent précédent 429 rate-limited, à relancer post-quota) |
| 4 | `ADR-OMK-001` (dual-product deployment) | ✅ RATIFIED 2026-06-11 in `_SPECS/ADR/` (D1-D10 figés, Caddyfile snippets, no Vercel) |

Without these ratified, **Phase B (Supabase schemas + RLS) is blocked** on the remaining MCP `supabase-aspace` v0.1. 3/4 ADRs are now ratified (2026-06-11). These drafts exist to shorten the feedback loop when the MCP lands.

---

## Execution protocol

1. **ADR-SUPABASE-001 + ADR-OMK-001 + ADR-OMK-002 ratified 2026-06-11.** Remaining: finish `ADR-OMK-003` (MCP `supabase-aspace` v0.1) — sub-agent précédent 429 rate-limited, à relancer post-quota. Read the 3 ratified ADRs end-to-end before applying.
2. **Create the PG roles** on the VPS Supabase instance via Codex/Hermes. Document the credentials path (do NOT commit the passwords — env User Windows scope per `CLAUDE.md` doctrine).
3. **Implement MCP `supabase-aspace` v0.1** — a thin wrapper around the official Supabase MCP that scopes writes to the `aspace_admin` role. Validate against a throwaway schema first.
4. **Apply the SQL files in order** (1 → 5) using the MCP wrapper. The wrapper should emit a per-file diff and require HITL sign-off before the next file runs.
5. **Wire the JWT hook** in Supabase Auth dashboard (post-`04_jwt_hook.sql`).
6. **Reload PostgREST** (`PGRST_DB_SCHEMAS` includes `omk_internal,omk_saas`, restart `supabase-core`).
7. **Smoke-test** as described below.

**Never** run these files directly from this Claude Code session. The executor must be a HITL agent operating on the VPS, with the MCP wrapper mediating the writes.

---

## Verification after execution

After all 5 SQL files have been applied and the JWT hook is wired, run the following checks before opening Phase C (auth/tenant wiring in the dashboard).

### 1. Schema exists

```bash
psql "postgres://postgres:<pwd>@supabase.148.230.92.235.sslip.io:5432/postgres" \
  -c "\dn omk_internal"
psql "postgres://postgres:<pwd>@supabase.148.230.92.235.sslip.io:5432/postgres" \
  -c "\dn omk_saas"
psql "postgres://postgres:<pwd>@supabase.148.230.92.235.sslip.io:5432/postgres" \
  -c "\dt omk_saas.*"
```

Expected: both schemas listed, 7 tables under `omk_saas` (`organizations`, `memberships`, `clients`, `documents`, `agents`, `invoices`, `sops`), 5 tables under `omk_internal`.

### 2. RLS is enabled

```bash
psql ... -c "SELECT schemaname, tablename, rowsecurity, forcerowsecurity
             FROM pg_tables
             WHERE schemaname IN ('omk_saas','omk_internal')
             ORDER BY schemaname, tablename;"
```

Expected: every row has `rowsecurity = t` and `forcerowsecurity = t` for saas tables.

### 3. RLS adversarial test (the load-bearing one)

Create two JWTs — one for a user in org A, one for a user in org B — and verify the JWT hook injects different `org_id` claims. Then from each JWT's session, query `omk_saas.clients`:

```bash
# From org A session (expect to see only Acme rows)
curl -H "Authorization: Bearer $JWT_ORG_A" \
  "https://supabase.148.230.92.235.sslip.io/rest/v1/clients?select=id,name,org_id"

# From org B session (expect 0 rows from Acme, only OrgB rows)
curl -H "Authorization: Bearer $JWT_ORG_B" \
  "https://supabase.148.230.92.235.sslip.io/rest/v1/clients?select=id,name,org_id"
```

**Pass criteria:** each user sees only their org's clients. Cross-tenant read returns an empty array, **not** an error (RLS silently filters — that's the design).

### 4. Service role bypass

```bash
# With SERVICE_ROLE_KEY (server-side only) — must see ALL rows
curl -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  "https://supabase.148.230.92.235.sslip.io/rest/v1/clients?select=count"
```

Expected: returns the true total count across all orgs.

### 5. JWT claim check

Decode any user JWT (e.g. via https://jwt.io) and confirm the payload includes:

```json
{
  "app_metadata": {
    "org_id": "<uuid>",
    "role": "owner",
    "memberships": [ { "org_id": "<uuid>", "role": "owner" } ],
    "email": "..."
  },
  "org_id": "<uuid>",
  "role": "owner"
}
```

If `org_id` is missing, **stop**: the JWT hook is not wired or has a bug. RLS will silently return 0 rows for that user.

### 6. Client-side warn (frontend, not SQL)

In `src/auth/AuthProvider.tsx`, add a `console.warn` when `APP_MODE === 'saas' && orgId == null`. This catches the silent-failure mode described in `apps/dashboard/CLAUDE.md` gotcha #4.

### 7. Type generation (Phase B step 4)

```bash
npx supabase gen types typescript --schema omk_saas,omk_internal \
  --project-id <self-hosted-project-id> > src/lib/database.types.ts
```

Expected: non-empty `database.types.ts` with `Database['omk_saas']['Tables']['clients']['Row']` etc.

---

## File-by-file summary

| File | Lines (approx) | Purpose |
|------|----------------|---------|
| `01_omk_internal_schema.sql` | ~135 | Internal schema + 5 tables + grants |
| `02_omk_saas_schema.sql`     | ~190 | SaaS schema + 7 tables (orgs, memberships, 5 business) + grants |
| `03_rls_policies.sql`        | ~190 | RLS enable + per-table tenant policies + service_role bypass + `current_org_id()` helper |
| `04_jwt_hook.sql`            | ~115 | Custom Access Token Hook (memberships → JWT claims) |
| `05_seed_dev.sql`            | ~120 | DEV-only seed (idempotent, 1 org + sample rows) |
| `99_README.md`               | this file | Order, blockers, execution protocol, verification |

---

## Open questions for A0 (defer to ratification session)

1. **`aspace_observer` scope** — is "no PII" the right default? Should the observer see org names and SOP titles but no client/agent/invoice data? (Current draft: yes.)
2. **`requested_org` event payload** — for multi-org users, does the client send the desired `org_id` in the sign-in event? (Current draft: yes; hook falls back to first membership.)
3. **`memberships` writes** — who provisions memberships? Service_role only, or is there a "self-signup creates owner membership" path? (Current draft: service_role only — SignupView would call a server-side function via Edge Function.)
4. **Internal mode RLS** — this draft doesn't include RLS for `omk_internal.*` (the brief didn't ask for it). Should we add a role-based policy restricted to `omk_staff` in a follow-up?
5. **Slug vs domain** — `organizations.slug` is unique. Will the dashboard use it for subdomain routing (`<slug>.omk-saas.aspace.fr`)? If yes, slug format constraint may need to be relaxed.
