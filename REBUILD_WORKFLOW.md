# 🔆 OMK Dashboard — Workflow de Rebuild Deployment-Ready

> **Date** : 2026-06-08 · **Décideur** : A0 Amadeus · **Auteur** : Claude Code (A2)
> **ADR** : `_SPECS/ADR/ADR-OMK-001` (dual-product) + `_SPECS/ADR/ADR-SUPABASE-001` (multi-tenant Supabase)
> **Supersede** : `picard_audit.md` (2026-05-25) — périmé sur la modularisation (déjà faite).
> **Décisions verrouillées** : 1 codebase / 2 modes runtime · single-schema `omk_saas` + org_id + RLS · full deployment-ready.

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
| G | Déploiement Dokploy (2 services) | 🟡 UNBLOCKED (gates lifted) | ADR-OMK-001 RATIFIED 2026-06-11 — peut démarrer dès MCP `supabase-aspace` prêt |
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
│   └── mode.ts                  # resolveAppMode(): 'internal' | 'saas' (VITE_APP_MODE)
├── lib/
│   ├── types.ts                 # types métier (conservés, + Organization, Membership)
│   ├── supabase.ts              # createClient({ db: { schema: mode==='saas'?'omk_saas':'omk_internal' }})
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

## 2. Schémas Supabase (via MCP `supabase-aspace`, dépend de ADR-SUPABASE-001)

### 2.1 `omk_internal` (single-tenant OMK)
```sql
CREATE SCHEMA IF NOT EXISTS omk_internal;
-- tables: clients, documents, agents, invoices, sops (miroir des types.ts)
-- RLS: staff OMK uniquement (membership rôle 'omk_staff')
```

### 2.2 `omk_saas` (multi-tenant PME)
```sql
CREATE SCHEMA IF NOT EXISTS omk_saas;

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

> `org_id` injecté dans le JWT via hook `auth` (custom access token hook Supabase) qui lit `memberships`.
> **Étape humain-in-the-loop** (ADR-SUPABASE-001 D7) : ajout de `omk_internal,omk_saas` à `PGRST_DB_SCHEMAS` + restart `supabase-core` (côté VPS, Codex/Hermes).

---

## 3. Phases d'exécution (deployment-ready)

### Phase A — Fondations (local, pas de prod)
1. `npm i @supabase/supabase-js react-router-dom`
2. `src/config/mode.ts` — résout `VITE_APP_MODE`.
3. `src/lib/supabase.ts` — client schema-aware.
4. `.env.example` — ajouter `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_MODE`.
5. `npm run lint` (tsc --noEmit) GREEN.

### Phase B — Schémas + seed (via supabase-aspace)
1. `create_project_schema('omk_internal')` + `create_project_schema('omk_saas')`.
2. Migrations tables + RLS (section 2).
3. Seed depuis `lib/seed.ts` (ex-mocks) dans `omk_internal` pour démo.
4. `generate_typescript_types` → `src/lib/database.types.ts`.
5. Reload `PGRST_DB_SCHEMAS` (HITL VPS).

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

### Phase G — Déploiement Dokploy (via MCP, canal bypass)
1. 2 services Dokploy : `omk-dashboard-internal` (VITE_APP_MODE=internal) + `omk-dashboard-saas` (VITE_APP_MODE=saas).
2. Env Supabase par service. Routes Caddy/Traefik (sous-domaines distincts).
3. Smoke test : login, CRUD scoped, **test isolation org A vs org B**.

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

## 5. Dépendances bloquantes
| Bloqueur | Statut |
|---|---|
| ADR-SUPABASE-001 ratifié | ✅ ACCEPTED 2026-06-08 |
| Rôles PG `aspace_admin`/`aspace_observer` | ✅ RATIFIED + PROVISIONED 2026-06-13 (ADR-OMK-002, script 06_provision_pg_roles_omk.sql applied + patched, D1-verified NOLOGIN NOSUPERUSER NOINHERIT + 8/9 schema REVOKEs via `has_schema_privilege()`, pgsodium absent expected) |
| MCP `supabase-aspace` v0.1 | 🟡 ADR-OMK-003 en rédaction (429 rate-limited, à relancer post-quota) |
| ADR-OMK-001 ratifié | ✅ RATIFIED 2026-06-11 (D1-D10 figés, Caddyfile snippets, no Vercel) |
| Hook `custom_access_token_hook` | ✅ WIRED + ACTIVATED 2026-06-14 (omk_saas.memberships first, solaris_saas fallback, SECURITY DEFINER, `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=true` in docker-compose.yml, JWT contains `org_id` + `app_metadata.role=owner`) |
| Deploy `omk.kalybana.com` | ✅ LIVE 2026-06-14 (HTTP 200 in 95ms, Caddy reverse proxy, LE cert auto-issued, Vite build dist/ served, PostgREST via `Accept-Profile: omk_saas` header) |

> Le rebuild suit le pattern du skill `picard-audit-and-prod-workflow` (audit→migrate→verify→GitHub→Dokploy), **étendu** avec la couche Supabase multi-tenant. Réutiliser ce skill, ne pas en créer un nouveau.
