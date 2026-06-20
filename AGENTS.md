# OMK Dashboard — Agent Contract

> **Stack**: Vite 6.2 + React 19 + TS 5.8 + Tailwind v4 + @supabase/supabase-js 2.107
> **Single-mode runtime (post-ADR-OMK-004 A1)**: `VITE_APP_MODE=saas` baked at build → `omk_saas` only (mode `internal` retiré 2026-06-19)
> **Deploy**: Vercel (team `omk-services`, project `omk-saas-os`) — single project, single schema
> **Hosting**: Supabase Cloud (OMK Services Org) — pivot Dokploy/self-host → Vercel/Cloud per **ADR-OMK-004 RATIFIED 2026-06-19** + tenant isolation **ADR-OMK-005 RATIFIED 2026-06-20**
> **Date stamped**: 2026-06-10 (original) · 2026-06-19 (pivot post-ADR-OMK-004) · **2026-06-20 (Phase A→F complete, see §2)**

## 1. The ADR canon (post-ADR-OMK-005 RATIFIED 2026-06-20)

| # | ADR | Status |
|---|-----|--------|
| 1 | `ADR-SUPABASE-001` (multi-tenant Supabase self-host) | ✅ ACCEPTED 2026-06-08 → **superseded fonctionnellement 2026-06-19** par ADR-OMK-004 (self-host → Supabase Cloud) |
| 2 | PG roles `aspace_admin` / `aspace_observer` (ADR-OMK-002) | ✅ RATIFIED + **CLOUD-PROVISIONED 2026-06-20** (Phase A) |
| 2b | `custom_access_token_hook` (self-host → Cloud) | ✅ **CLOUD-DEPLOYED 2026-06-20** (function created, GRANT EXECUTE to supabase_auth_admin). **⚠️ A0 ACTION: wire in Auth dashboard** (D6 #64) |
| 3 | MCP `supabase-aspace` v0.1 (ADR-OMK-003) | 🟡 en rédaction (scopes à pivoter self-host URL → Cloud PAT) |
| 4 | `ADR-OMK-001` (dual-product deployment) | ✅ RATIFIED 2026-06-11 → **AMENDED 2026-06-19** par ADR-OMK-004 §runtime : single-mode SaaS only (A1 LOCKED) |
| **5** | `ADR-OMK-004` (pivot Supabase Cloud + Vercel) | ✅ RATIFIED 2026-06-19 (single SaaS mode, 5 conditions) |
| **6** | **`ADR-OMK-005` (tenant isolation guard)** | ✅ **RATIFIED 2026-06-20** (Phase A→F: useOrg + assertOrgIdForWrite + ProtectedRoute + JWT cache) |

## 2. Phase State (post-2026-06-20 sprint A→F)

| Phase | Description | State |
|-------|-------------|-------|
| A | Cloud SQL migration | ✅ **DONE 2026-06-20** — 9 `omk_saas.*` tables (7 core + legal_docs + sales_leads), 30+ RLS policies, JWT hook function, PG roles (aspace_admin + aspace_observer), seed (1 org + 1 user + 5 clients + docs/agents/invoices/sops), drift `public.*` archived in `_archive_drift_2026_06_20` |
| B | Vercel + Auth wiring | ✅ **DONE 2026-06-20** — runbook persisté, 2 A0 actions pending for live E2E (hook wiring + PGRST_DB_SCHEMAS). 2 D6 lessons (#62 #63) shipped |
| C | Repository + tenant guard | ✅ **DONE 2026-06-20** — `useOrg()` hook, `getActiveOrgId()` non-React accessor, `assertOrgIdForWrite()` assertion fn. tsc 0 errors, vite build OK |
| D | Views upgrade | ✅ **DONE 2026-06-20** — `ViewShell` primitive (DRY for 14 views), 6 static views wrapped, `legalDocsRepo` + `salesLeadsRepo` wired to live DB. 11/14 views now read from Cloud. tsc + build green |
| E | Routing + auth guard | ✅ **DONE 2026-06-20** — `<Routes>` + 17 paths (`/login` `/signup` public, 14 protected, 404), `ProtectedRoute` wrapper, `useNavigate` in auth views, `DEMO_MODE` flag removed. Bundle 266 KB |
| F | Edge Function + Sign Out | ✅ **DONE 2026-06-20** — `sign-up-organization` Edge Function deployed (id `e47f4aa1`, ACTIVE). `signUp()` flow: signUp → signIn → invoke → refreshSession. Sign Out button in Sidebar |
| G | Vercel deploy + live E2E | ⏳ **READY** — push to main → Vercel auto-deploys. ⚠️ 4 cumulative A0 actions must complete first (see §10) |
| H | Docs + ADR + skills | ✅ **DONE 2026-06-20** — `ADR-OMK-005` RATIFIED, `cloud-bootstrap` skill created, `AGENTS.md` updated, `wiki/log.md` + `MEMORY.md` updated |

## 3. Single-Mode Runtime Contract (post-ADR-OMK-004, A1 LOCKED 2026-06-19)

**One codebase, one product, single SaaS mode.** Per ADR-OMK-004 §Condition A = A1, mode `internal` retiré. Mode est BAKED à `vite build` time via `VITE_APP_MODE=saas`, NOT a runtime toggle.

| Mode | Schema | Auth | User | RLS |
|------|--------|------|------|-----|
| `saas` (only) | `omk_saas` | Signup via Edge Function → login | External PME clients | `org_id = (auth.jwt() ->> 'org_id')::uuid` |

**Avant 2026-06-19** : dual-mode Dokploy (2 services × 2 subdomains). Post-pivot ADR-OMK-004 : single Vercel project, single schema, single product.

## 4. Supabase Architecture (Cloud, OMK Services Org)

- **Supabase Cloud** (OMK Services Org, project `OMK SERVICES CUSTOMERS` = `ndvqwcapwcnpdvknxcjw`).
- Client: `@supabase/supabase-js` 2.107 (NO `@supabase/ssr` — we're a Vite SPA, not Next.js).
- `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** — never `VITE_*`. Used by Edge Function `sign-up-organization` only.
- Multi-tenancy via `org_id` claim injected by **`public.custom_access_token_hook`** (deployed Phase A, wired A0 action pending). Reads `omk_saas.memberships`.
- **Defense-in-depth** (ADR-OMK-005): RLS server-side + `useOrg()` client-side + `assertOrgIdForWrite()` pre-flight + `ProtectedRoute` auth gate.
- **PGRST_DB_SCHEMAS** must include `omk_saas` (A0 action, D6 #68). Until then, REST API returns 404 for any `omk_saas.*` table.

## 5. Data Flow (post-Phase D)

```
src/components/views/*.tsx (14 views, all wrapped in <ViewShell>)
  ├── useOrg() reads AuthContext (user.orgId, user.role)
  ├── repo.list() / create() / update() / remove() via makeRepository<T>
  │
  ▼
src/data/repository.ts  (makeRepository<T>)
  ├── if SUPABASE_READY → supabase.from(table).select/insert/update/delete (RLS-scoped, tenant guard via assertOrgIdForWrite)
  └── else              → localStorage seeded with mocks (dev fallback, filters by org_id)
```

**Today** (2026-06-20) 11/14 views read from Cloud via repos: clients, documents, agents, invoices, sops, tasks, **legal_docs** (new in Phase D), **sales_leads** (new in Phase D). 3 views use static mocks: Marketplace (catalog post-PMF), Growth (consolidated pipeline, Phase D2), Settings (user profile, Phase D2).

## 6. Sidebar Contract (post 2026-06-10 port)

4 nav groups (AaaS doctrine) × 14 items total:

| Group | Items |
|-------|-------|
| CULTIVATE | Dashboard · Finance · People |
| NURTURE | Clients · Documents · SOP Library · Tasks |
| BLOOM | AI Agents Network · Growth · Sales · Marketplace |
| ROOTS | Legal · IT & Data · System Roots |

Icons via `lucide-react`. Sidebar is collapsible (`w-20` collapsed / `w-64` expanded). Routing is still `useState(activeTab)` — Phase E will swap to `react-router-dom 7`.

## 7. Doctrine Constraints (non-negotiable)

- **No-hard-delete** — never `Remove-Item` / `rm -rf`; use `_TRASH/`.
- **Test Key Pragma** — never paste or read secrets from `.md` / `.json` / `.env`; env vars User scope only.
- **Repo-Home short** (ADR-INFRA-002) — no nested build-bearing repos.
- **Migration scope discipline** (REBUILD_WORKFLOW §4) — one phase at a time.
- **Vercel only (post-pivot 2026-06-19)** — Vercel project `omk-saas-os` (team `omk-services`, dpl_Fx8b821, READY) est l'unique cible deploy. L'ancien Vercel project orphaned `prj_FJpNDykkNMhDJUEg2FvKAegeeQG3` est archivé. ~~**No Vercel**~~ doctrine radier post-ADR-OMK-004.
- **Trust Zone** — everything in `C:\Users\amado\`, never `C:\` root.

## 8. Files to Read First When Picking This Up

1. `C:\Users\amado\ASpace_OS_V2\30_Business_OS\10_Projects\omk\CLAUDE.md` (project root, this file's parent map)
2. `apps/dashboard/REBUILD_WORKFLOW.md` — the 8-phase contract
3. `apps/dashboard/AGENTS.md` — this file
4. `apps/dashboard/src/config/mode.ts` + `apps/dashboard/src/lib/supabase.ts` + `apps/dashboard/src/data/repository.ts` — the data layer triple
5. `apps/dashboard/src/App.tsx` — current shell + Sidebar wiring
6. `apps/dashboard/sql/99_README.md` — DDL drafts (4 ADR blockers)
7. `00_Amadeus/30_MEMORY_CORE/LLM_Wiki/wiki/hand_offs/handoff_omk_dashboard_dev_2026-06-10.md` — full handoff
8. `00_Amadeus/30_MEMORY_CORE/LLM_Wiki/wiki/hand_offs/skills_queue.md` — open skill proposals
