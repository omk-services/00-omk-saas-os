# 🔆 OMK Dashboard — Workflow de Rebuild Deployment-Ready

> **Date** : 2026-06-08 (original) · **Pivot** : 2026-06-19 (ADR-OMK-004 RATIFIED)
> **Décideur** : A0 Amadeus · **Auteur original** : Claude Code (A2) · **Pivot update** : Claude Code (A2)
> **ADR** : `_SPECS/ADR/ADR-OMK-001` (dual-product — **AMENDED 2026-06-19**, see ADR-OMK-004) + `_SPECS/ADR/ADR-SUPABASE-001` (multi-tenant Supabase — **superseded fonctionnellement**, see ADR-OMK-004) + **`ADR-OMK-004` RATIFIED 2026-06-19** (Supabase Cloud + Vercel, single-mode SaaS)
> **Supersede** : `picard_audit.md` (2026-05-25) — périmé sur la modularisation (déjà faite).
> **Décisions verrouillées (post-ADR-OMK-004)** : **single-mode SaaS** (`VITE_APP_MODE=saas` only, A1 LOCKED 2026-06-19) · single-schema `omk_saas` + org_id + RLS · Supabase **Cloud** (OMK Services Org) · Vercel deploy (omk-services team) · full deployment-ready.

---

## 0. État vérifié (point de départ)

| Dimension | État réel (2026-06-08) |
|---|---|
| Stack | Vite 6 · React 19 · TS 5.8 · Tailwind v4 · @google/genai · motion · lucide-react |
| Modularisation | ✅ FAITE (App.tsx 144 l., 7 views, lib/types+constants) |
| Backend / persistance | ❌ 100% mock (`constants.ts`), aucun `@supabase/supabase-js` |
| Auth / tenant | ❌ "Admin User" hardcodé (App.tsx l.93) |
| Routing | ⚠️ `useState(activeTab)` — pas d'URL |
| Serveur prod | ❌ `express` en deps mais aucun `server.js` / `Dockerfile` |
| Repo | `github.com/Amdkn/01-OMK-Business-OS` (1 commit, clean) |

### 0.1 État phases A→H (vérifié 2026-06-10)

| Phase | Description | État (2026-06-10) | Note |
|-------|-------------|-------------------|------|
| A | Foundations locales | ✅ DONE | 2026-06-10: `npm run lint` exit=0, `tsc --noEmit` exit=0 (verified by A2) |
| B | Schémas + seed Supabase | ❌ BLOCKED | gated par ADR-OMK-003 (MCP `supabase-aspace` v0.1, en rédaction) — 3/4 ADR ratifiés (cf. §5) |
| C | Auth + tenant | ❌ NOT STARTED | "Admin User" toujours hardcodé dans App.tsx |
| D | Repositories + branchement vues | 🟡 PARTIAL | 2026-06-10: 7 missing views ported (Sidebar extracted, 7 new views + 7 skeletons + 7 empty states). Lint+tsc GREEN. Repos still wired to `lib/constants.ts` (Phase D step 2 incomplete). |
| E | Routing react-router-dom 7 | ❌ NOT STARTED | `useState(activeTab)` toujours en place dans App.tsx |
| F | Serveur + conteneur | 🟡 PARTIAL | `server.js` (Express) + `Dockerfile` (node:20-alpine) présents |
| G | Déploiement Vercel (1 project, single-mode SaaS) | 🟡 PIVOTING (ADR-OMK-004 RATIFIED 2026-06-19) | A1 LOCKED : single-mode SaaS. Vercel project `omk-saas-os` (team omk-services, dpl_Fx8b821) créé. Auth ON par défaut (Condition D : à OFF UI). |
| H | Tests isolation + handoff | ❌ NOT STARTED | gated par B/C/D/G |

> Les transitions de cette journée incluent : (a) ratifications ADR du 2026-06-11 (ADR-SUPABASE-001 ACCEPTED, ADR-OMK-001 RATIFIED, ADR-OMK-002 RATIFIED) — reflétées dans §0.1 (Phases B et G gates), §5 (table 4 ADR blockers), et propagées aux autres docs dashboard ; (b) Phase A: 🟡 PARTIAL → ✅ DONE et Phase D: ❌ NOT STARTED → 🟡 PARTIAL. ADR-OMK-003 (MCP supabase-aspace) reste en rédaction, à relancer post-quota 429.

---

## 1. Architecture cible

```
src/
├── main.tsx
├── App.tsx                      # shell + <RouterProvider>
├── index.css                    # Design System (conservé)
├── config/
│   └── mode.ts                  # resolveAppMode(): 'saas' (single mode per ADR-OMK-004 A1)
├── lib/
│   ├── types.ts                 # types métier (conservés, + Organization, Membership)
│   ├── supabase.ts              # createClient({ db: { schema: 'omk_saas' }}) — single schema per A1
│   └── seed.ts                  # ex-constants.ts → utilisé seulement pour seed SQL/dev
├── auth/
│   ├── AuthProvider.tsx         # session Supabase + org_id courant (JWT claim)
│   ├── useAuth.ts
│   └── LoginView.tsx / SignupView.tsx (saas)
├── data/                        # repositories (remplacent les mocks)
│   ├── clients.repo.ts          # findAll/create/update via supabase, RLS-scoped
│   ├── documents.repo.ts
│   ├── agents.repo.ts
│   ├── invoices.repo.ts
│   └── sops.repo.ts
├── routes/                      # react-router
│   └── router.tsx               # /dashboard /clients /documents /agents /finance /sop /settings
└── components/
    ├── Badge/Card/ProgressBar (conservés)
    └── views/ (conservés, branchés sur data/ au lieu de constants)
server.js                        # Express sert dist/ en prod
Dockerfile                       # multi-stage build → Node Express
.dockerignore
```

---

## 2. Schémas Supabase (Cloud, OMK Services Org, post-ADR-OMK-004)

**Pivot** : avant 2026-06-19, hosting self-host VPS `148.230.92.235` (ADR-SUPABASE-001). ADR-OMK-004 pivote vers **Supabase Cloud** (OMK Services Org). A1 LOCKED : mode `internal` retiré, single schema `omk_saas` only.

### 2.1 `omk_internal` — **RETIRED (A1 LOCKED 2026-06-19)**

Schema `omk_internal` archivé. Le mode `internal` du runtime baked est retiré. **Pas de re-déploiement de ce schema sur Cloud**. Si l'OMK staff avait des données, elles restent sur self-host en archive (D4 no-hard-delete).

### 2.2 `omk_saas` (multi-tenant PME, **Cloud-only**)
```sql
-- Sur Supabase Cloud (OMK Services Org, project_id via SUPABASE_OMK_URL env var)
-- Schéma principal, RLS-driven par org_id JWT claim

CREATE TABLE omk_saas.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text DEFAULT 'starter',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE omk_saas.memberships (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id  uuid REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  role    text NOT NULL DEFAULT 'member',
  PRIMARY KEY (user_id, org_id)
);

-- chaque table métier porte org_id + RLS
-- exemple clients :
CREATE TABLE omk_saas.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  name text, email text, service text, status text, progress int, created_at timestamptz DEFAULT now()
);
ALTER TABLE omk_saas.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON omk_saas.clients
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
-- idem documents, agents, invoices, sops
```

> `org_id` injecté dans le JWT via hook `auth` (custom access token hook Supabase) qui lit `omk_saas.memberships`.
> **HITL Cloud** (ADR-OMK-004 Condition B, sub-step 2.5 runbook) : re-provisionner le hook sur Supabase Cloud via Dashboard UI → Authentication → Hooks (le hook self-host reste actif sur VPS mais ne sert plus l'app prod).

---

## 3. Phases d'exécution (deployment-ready)

### Phase A — Fondations (local, pas de prod)
1. `npm i @supabase/supabase-js react-router-dom`
2. `src/config/mode.ts` — résout `VITE_APP_MODE`.
3. `src/lib/supabase.ts` — client schema-aware.
4. `.env.example` — ajouter `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_MODE`.
5. `npm run lint` (tsc --noEmit) GREEN.

### Phase B — Schémas + seed (Supabase **Cloud** post-pivot)
1. ~~`create_project_schema('omk_internal')`~~ **RETIRED (A1)** — only `omk_saas` schema created.
2. `create_project_schema('omk_saas')` sur Supabase Cloud OMK Services Org (via `mcp__supabase-omk__*` post-CC-restart).
3. Migrations tables + RLS (section 2.2).
4. Seed depuis `lib/seed.ts` (ex-mocks) dans `omk_saas` pour démo.
5. `generate_typescript_types` → `src/lib/database.types.ts`.
6. ~~Reload `PGRST_DB_SCHEMAS` (HITL VPS)~~ — non requis sur Cloud (auto-managed).

### Phase C — Auth + tenant
1. `AuthProvider` + `useAuth` (session + org_id).
2. `LoginView` (internal) / `SignupView`+création org (saas).
3. Custom access token hook → `org_id` dans JWT.
4. Remplacer "Admin User" hardcodé par session réelle.

### Phase D — Repositories + branchement views
1. `data/*.repo.ts` (findAll/create/update RLS-scoped).
2. Brancher les 7 views sur les repos (supprimer imports `constants`).
3. Loading/empty/error states (les views étaient sur data synchrone).

### Phase E — Routing
1. `routes/router.tsx` (react-router) ; App.tsx → `<RouterProvider>`.
2. Sidebar → `<NavLink>`, `activeTab` supprimé.

### Phase F — Serveur + conteneur
1. `server.js` Express (sert `dist/`, fallback SPA, healthcheck `/healthz`).
2. `Dockerfile` multi-stage + `.dockerignore`.
3. `npm run build` + test `node server.js` local.

### Phase G — Déploiement Vercel (post-ADR-OMK-004, 2026-06-19)

**Note pivot** : avant 2026-06-19, ce phase était Dokploy (2 services × 2 subdomains). ADR-OMK-004 RATIFIED + A1 LOCKED pivotent vers Vercel (single project, saas mode only).

1. **Vercel project** : `omk-saas-os` (team `omk-services`, deploy ID `dpl_Fx8b821`, preview URL `omk-saas-9q6hbl8xz-omk-services.vercel.app`). VITE_APP_MODE=saas baked.
2. **Env vars** (Vercel project settings, **PAS** Dokploy panel) :
   - `VITE_APP_MODE=saas` (baked at build)
   - `VITE_SUPABASE_URL` (Supabase Cloud OMK Services Org — `SUPABASE_OMK_URL` env var)
   - `VITE_SUPABASE_ANON_KEY` (PUBLIC, bundled in JS — `SUPABASE_OMK_ANON_KEY`)
   - `GEMINI_API_KEY` (PUBLIC, bundled — rotate if exposed)
   - `SUPABASE_SERVICE_ROLE_KEY` **NEVER** client-side
3. **Vercel Authentication** : OFF par défaut UI (Condition D, Étape 4 runbook ADR-OMK-004) — sinon URLs preview retournent 401
4. **Custom domain** (optionnel) : `omk.kalybana.com` → CNAME → `cname.vercel-dns.com` (DNS via Hostinger MCP)
5. **Smoke test post-deploy** : login user, CRUD scoped, **test isolation org A vs org B** (RLS `org_id` claim dans JWT)
6. **Rollback path** (si pivot échoue) : Dokploy n'est plus viable (KVM 2 saturé). Rollback = restore self-host Supabase + Dokploy (coût > greenfield, **NON RECOMMANDÉ** per ADR-OMK-004 §Rollback).

### Phase H — Tests isolation + handoff
1. Test adversarial : un user org A ne lit jamais les données org B (RLS).
2. Mise à jour README (remplace boilerplate AI Studio).
3. Commit conventionnel + push `01-OMK-Business-OS`.
4. MAJ `30_MEMORY_CORE/README.md` + registre schémas.

---

## 4. Garde-fous
- Le **mode ne se déduit jamais du client seul** — validé serveur + JWT (sinon fuite cross-produit).
- `SERVICE_ROLE_KEY` **jamais** côté client/Vite (`VITE_*` est public).
- RLS testée avant tout trafic réel.
- Born-short (ADR-INFRA-002) : le repo build-bearing reste à `30_Business_OS/...` court ; vérifier MAX_PATH.

---

## 5. Dépendances bloquantes (post-ADR-OMK-004)
| Bloqueur | Statut |
|---|---|
| ADR-SUPABASE-001 ratifié | ✅ ACCEPTED 2026-06-08 → **superseded fonctionnellement 2026-06-19 par ADR-OMK-004** (self-host → Supabase Cloud) |
| Rôles PG `aspace_admin`/`aspace_observer` | ✅ RATIFIED + PROVISIONED 2026-06-13 (ADR-OMK-002, sur self-host ; **à re-provisionner sur Cloud** post-pivot) |
| MCP `supabase-aspace` v0.1 | 🟡 ADR-OMK-003 en rédaction (429 rate-limited, à relancer post-quota — **scopes à pivoter** : self-host URL → Cloud PAT) |
| ADR-OMK-001 ratifié | ✅ RATIFIED 2026-06-11 → **AMENDED 2026-06-19** par ADR-OMK-004 §runtime : single-mode SaaS only (A1 LOCKED). Deploy section pivotée Dokploy → Vercel |
| **ADR-OMK-004 ratifié** | ✅ **RATIFIED 2026-06-19** (Supabase Cloud + Vercel, single-mode SaaS, A1 LOCKED) |
| Hook `custom_access_token_hook` (self-host) | ✅ WIRED + ACTIVATED 2026-06-14 (omk_saas.memberships first, solaris_saas fallback, SECURITY DEFINER) — **⚠️ à re-provisionner sur Supabase Cloud** (ADR-OMK-004 Condition B, sub-step 2.5 runbook) |
| Vercel project `omk-saas-os` (team `omk-services`) | ✅ DEPLOYED 2026-06-17 (dpl_Fx8b821, READY) — **⚠️ Vercel Authentication ON par défaut, à OFF UI** (Condition D) |
| Custom domain `omk.kalybana.com` | 🟡 DNS à migrer vers CNAME Vercel (était A record vers VPS `148.230.92.235` self-host) |

> Le rebuild suit le pattern du skill `picard-audit-and-prod-workflow` (audit→migrate→verify→GitHub→Dokploy), **étendu** avec la couche Supabase multi-tenant. Réutiliser ce skill, ne pas en créer un nouveau.
