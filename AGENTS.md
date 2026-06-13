# OMK Dashboard — Agent Contract

> **Stack**: Vite 6.2 + React 19 + TS 5.8 + Tailwind v4 + @supabase/supabase-js 2.107
> **Dual-mode runtime**: `VITE_APP_MODE` baked at build → `omk_internal` / `omk_saas`
> **Deploy**: Dokploy (NOT Vercel) — 2 services × 2 schemas
> **Date stamped**: 2026-06-10

## 1. The 4 ADR Blockers (open + ratified)

| # | Blocker | Status |
|---|---------|--------|
| 1 | `ADR-SUPABASE-001` (multi-tenant Supabase) | ✅ ACCEPTED 2026-06-08 |
| 2 | PG roles `aspace_admin` / `aspace_observer` on VPS | ✅ RATIFIED + PROVISIONED 2026-06-13 — ADR-OMK-002 + script 06_provision_pg_roles_omk.sql applied (NOLOGIN NOSUPERUSER NOINHERIT, 8/9 schema REVOKEs verified, pgsodium absent expected, script cosmetic bug l.247/251 fixed) |
| 3 | MCP `supabase-aspace` v0.1 | 🟡 ADR-OMK-003 en rédaction (sub-agent précédent 429 rate-limited, à relancer post-quota) |
| 4 | `ADR-OMK-001` (dual-product deployment) | ✅ RATIFIED 2026-06-11 (D1-D10 figés, Caddyfile snippets, no Vercel) |

Without these ratified, **Phase B (Supabase schemas + RLS), Phase C (Auth/tenant), Phase D-step-2 (repos), Phase G (deploy)** are BLOCKED.

## 2. 8-Phase REBUILD State (verified 2026-06-10)

| Phase | Description | State |
|-------|-------------|-------|
| A | Foundations | ✅ DONE — `npm run lint` exit=0, tsc exit=0 |
| B | Schemas + seed Supabase | ❌ BLOCKED — DDL drafts in `apps/dashboard/sql/` awaiting ADR |
| C | Auth + tenant | ❌ NOT STARTED |
| D | Repositories + branchement vues | 🟡 PARTIAL — 14 vues + skeletons + empty states; repos still wrap `lib/constants.ts` mocks |
| E | Routing react-router-dom 7 | ❌ NOT STARTED — `useState(activeTab)` in App.tsx |
| F | Serveur + conteneur | 🟡 PARTIAL — `server.js` (Express) + `Dockerfile` (node:20-alpine) |
| G | Déploiement Dokploy (2 services) | ❌ BLOCKED — needs ADR-OMK-001 |
| H | Tests isolation + handoff | ❌ NOT STARTED |

## 3. Dual-Mode Runtime Contract

One codebase, two products, two build artifacts. Mode is BAKED at `vite build` time via `VITE_APP_MODE`, NOT a runtime toggle.

| Mode | Schema | Auth | User | RLS |
|------|--------|------|------|-----|
| `internal` | `omk_internal` | Staff sign-in (no signup) | OMK Services staff | Role-based `omk_staff` |
| `saas` | `omk_saas` | Signup + login (creates org) | External PME clients | `org_id = (auth.jwt() ->> 'org_id')::uuid` |

Two Dokploy services, not one with a switch. See `REBUILD_WORKFLOW.md` §3.

## 4. Supabase Architecture

- **Self-hosted** at `https://supabase.148.230.92.235.sslip.io` (VPS `aspace-vps`). NOT supabase.com.
- Client: `@supabase/supabase-js` 2.107 (NO `@supabase/ssr` — we're a Vite SPA, not Next.js).
- `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** — never `VITE_*`.
- Multi-tenancy via `org_id` claim injected by **Custom Access Token Hook** reading `omk_saas.memberships`.
- **JWT hook is silent-failure-prone**: if misconfigured, every saas RLS query returns 0 rows silently. Mitigation: add `console.warn` in client when `orgId == null && APP_MODE === 'saas'`.
- `PGRST_DB_SCHEMAS` reload on VPS is HITL (Codex/Hermes, per ADR-SUPABASE-001 D7) — not automatable from this CLI.

## 5. Data Flow (Phase D current state)

```
src/components/views/*.tsx
  └── (Phase D step 2 = swap to repos, NOT YET)
        │
        ▼
src/data/repository.ts  (makeRepository<T> with Supabase+localStorage fallback)
  ├── if SUPABASE_READY  → supabase.from(table) (RLS-scoped)
  └── else               → localStorage seeded with mocks (current dev path)
```

**Today** (2026-06-10) all 14 views render with mock data. Repos are wired to `lib/constants.ts`, not Supabase. Phase D step 2 (swap constants → repos) is the next concrete work item after ADR ratification.

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
- **No Vercel** — Vercel project `prj_FJpNDykkNMhDJUEg2FvKAegeeQG3` is UNUSED/orphaned.
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
