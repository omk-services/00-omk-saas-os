# OMK Dashboard — Agent Contract

> **Stack**: Vite 6.2 + React 19 + TS 5.8 + Tailwind v4 + @supabase/supabase-js 2.107
> **Single-mode runtime (post-ADR-OMK-004 A1)**: `VITE_APP_MODE=saas` baked at build → `omk_saas` only (mode `internal` retiré 2026-06-19)
> **Deploy**: Vercel (team `omk-services`, project `omk-saas-os`, dpl_Fx8b821) — single project, single schema
> **Hosting**: Supabase Cloud (OMK Services Org) — pivot Dokploy/self-host → Vercel/Cloud per **ADR-OMK-004 RATIFIED 2026-06-19**
> **Date stamped**: 2026-06-10 (original) · **2026-06-19 (pivot post-ADR-OMK-004)**

## 1. The ADR canon (post-ADR-OMK-004 RATIFIED 2026-06-19)

| # | ADR | Status |
|---|-----|--------|
| 1 | `ADR-SUPABASE-001` (multi-tenant Supabase self-host) | ✅ ACCEPTED 2026-06-08 → **superseded fonctionnellement 2026-06-19** par ADR-OMK-004 (self-host → Supabase Cloud) |
| 2 | PG roles `aspace_admin` / `aspace_observer` (ADR-OMK-002) | ✅ RATIFIED + PROVISIONED 2026-06-13 sur self-host (NOLOGIN NOSUPERUSER NOINHERIT, 8/9 schema REVOKEs verified). **⚠️ à re-provisionner sur Cloud** post-pivot |
| 2b | `custom_access_token_hook` (self-host) | ✅ WIRED + ACTIVATED 2026-06-14 (omk_saas.memberships first, solaris_saas fallback, SECURITY DEFINER). **⚠️ Condition B ADR-OMK-004 : à re-provisionner sur Supabase Cloud** |
| 3 | MCP `supabase-aspace` v0.1 (ADR-OMK-003) | 🟡 en rédaction (sub-agent précédent 429 rate-limited, à relancer post-quota — **scopes à pivoter** : self-host URL → Cloud PAT) |
| 4 | `ADR-OMK-001` (dual-product deployment) | ✅ RATIFIED 2026-06-11 → **AMENDED 2026-06-19** par ADR-OMK-004 §runtime : single-mode SaaS only (A1 LOCKED). Deploy section pivotée Dokploy → Vercel |
| **5** | **`ADR-OMK-004` (pivot Supabase Cloud + Vercel)** | ✅ **RATIFIED 2026-06-19** (Supabase Cloud OMK Services Org + Vercel team `omk-services`, A1 LOCKED single SaaS mode, 5 conditions fixées sauf B/C/D/E post-ratification) |

Without all 5 ADRs ratified, **Phase B (Supabase Cloud schemas + RLS), Phase C (Auth/tenant avec hook Cloud), Phase D-step-2 (repos), Phase G (Vercel deploy Auth OFF + custom domain)** are gated.

## 2. 8-Phase REBUILD State (verified 2026-06-10)

| Phase | Description | State |
|-------|-------------|-------|
| A | Foundations | ✅ DONE 2026-06-10 — `npm run lint` exit=0, tsc exit=0 |
| B | Schemas + seed Supabase | ✅ DONE 2026-06-13 — 7 omk_saas tables, 7 RLS policies `*_isolation` (cmd=ALL, role=public). ~~5 omk_internal~~ **RETIRED 2026-06-19 (A1 LOCKED)**. PG roles `aspace_admin` + `aspace_observer` provisioned self-host, **⚠️ à re-provisionner sur Cloud** |
| C | Auth + tenant | ✅ DONE 2026-06-13 (self-host) — AuthProvider/useAuth/LoginView/SignupView created, App.tsx auth gating, Sidebar uses useAuth. **⚠️ hook `custom_access_token_hook` à re-provisionner sur Cloud (Condition B)** |
| D | Repositories + branchement vues | ✅ DONE 2026-06-13 — 5 repos (clients/documents/agents/invoices/sops) + 6 views branched to repos (Dashboard, Clients, Documents, Agents, Finance, SOPLibrary) with useEffect+loading/error gates |
| E | Routing react-router-dom 7 | 🟡 DEFERRED — `useState(activeTab)` still in App.tsx (Phase E not prioritized for saas deploy) |
| F | Serveur + conteneur | ✅ DONE 2026-06-13 — `server.js` (Express) + `Dockerfile` (node:20-alpine) + Vite build dist/ + Vercel build pipeline (post-pivot) |
| G | Déploiement Vercel (saas) | 🟡 **PIVOTING 2026-06-19** (ADR-OMK-004) — Vercel project `omk-saas-os` (team `omk-services`, dpl_Fx8b821) créé + READY. **⚠️ Condition D pending** : Vercel Authentication OFF via UI Settings → Security. Hook `custom_access_token_hook` Cloud pending (Condition B). First user `omk-admin@kalybana.com` provisioned (self-host, à migrer vers Cloud) |
| H | Tests isolation + handoff | 🟡 DEFERRED — end-to-end JWT test passed (org_id in claims, RLS-scoped queries return 1 org + 0 clients), Playwright E2E + adversarial RLS test still pending |

## 3. Single-Mode Runtime Contract (post-ADR-OMK-004, A1 LOCKED 2026-06-19)

**One codebase, one product, single SaaS mode.** Per ADR-OMK-004 §Condition A = A1, mode `internal` retiré. Mode est BAKED à `vite build` time via `VITE_APP_MODE=saas`, NOT a runtime toggle.

| Mode | Schema | Auth | User | RLS |
|------|--------|------|------|-----|
| `saas` (only) | `omk_saas` | Signup + login (creates org) | External PME clients | `org_id = (auth.jwt() ->> 'org_id')::uuid` |

**Avant 2026-06-19** : dual-mode Dokploy (2 services × 2 subdomains). Post-pivot ADR-OMK-004 : single Vercel project, single schema, single product. Voir `REBUILD_WORKFLOW.md` §1 (header pivot 2026-06-19).

## 4. Supabase Architecture (Cloud, OMK Services Org)

- **Supabase Cloud** (OMK Services Org, project_id via `SUPABASE_OMK_URL` env var). PAS self-host `148.230.92.235` (archivé post-pivot).
- Client: `@supabase/supabase-js` 2.107 (NO `@supabase/ssr` — we're a Vite SPA, not Next.js).
- `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** — never `VITE_*`.
- Multi-tenancy via `org_id` claim injected by **Custom Access Token Hook** (Cloud, à re-provisionner) reading `omk_saas.memberships`.
- **JWT hook is silent-failure-prone**: if misconfigured, every saas RLS query returns 0 rows silently. Mitigation: add `console.warn` in client when `orgId == null`.
- Cloud auto-manages schema exposure (no `PGRST_DB_SCHEMAS` HITL reload — unlike self-host per ADR-SUPABASE-001 D7).

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
