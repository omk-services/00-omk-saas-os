# 🔆 OMK Services Business OS — Audit Technique & Correction de Dettes (Project Picard)

> **Date** : 2026-05-25  
> **Projet** : `02-omk-services-business-os` — Système d'exploitation d'agence autonome OMK Services  
> **Source** : `C:\Users\amado\ASpace_OS_V2\30_Business_OS\00_Summers_QuickAccess\01_OMK_BOS\B2_Business_Domains\03_Product_Flash_Avengers\00_Interface_Prototypes\02-omk-services-business-os`  
> **Objectif** : Refactoring Picard → Modularisation d'un monolithe géant et mise en place d'une infrastructure réutilisable et "Production-Grade".

---

## 1. Cartographie de l'Existant

Le prototype est construit sur une base technique moderne et performante (Vite 6 + React 19 + TypeScript + Tailwind CSS v4.0), ce qui constitue un excellent point de départ. Cependant, la quasi-totalité de l'application est centralisée sous forme de monolithe géant.

### 📁 Inventaire des Fichiers Source

| Fichier / Dossier | Taille | Rôle / Description |
| :--- | :--- | :--- |
| `index.html` | 311 B | Point d'entrée HTML principal de l'application. Charge le script d'initialisation Vite `src/main.tsx`. |
| `package.json` | 846 B | Dépendances et configurations Node/NPM (React 19, Tailwind v4, Express, dotenv, motion). |
| `tsconfig.json` | 508 B | Configuration du compilateur TypeScript. |
| `vite.config.ts` | 708 B | Configuration du bundler Vite (Tailwind v4, alias de chemins, gestion du HMR). |
| `src/main.tsx` | 231 B | Point d'entrée de montage du DOM React. |
| `src/index.css` | 23 B | Fichier de styles global pratiquement **vide** (uniquement l'import Tailwind). |
| `src/App.tsx` | **46.9 KB** | **Monolithe géant de 850 lignes** contenant tous les types, tous les mocks de données, 3 sous-composants UI et les 7 vues métier entières. |

**Total** : 7 fichiers · ~50 KB · **Dette majeure de maintenabilité sur le fichier unique `App.tsx`**.

---

## 2. Diagnostic des Dettes Techniques

Contrairement à d'autres prototypes statiques, le projet possède déjà un pipeline de build (Vite/TS/Tailwind). Les bloqueurs critiques sont d'ordre architectural.

### 🔴 CRITICAL — Bloquants Déploiement & Pipeline

*Aucun bloqueur critique bloquant la compilation locale (le projet démarre).*

### 🟠 HIGH — Dettes Architecturales & Maintenabilité

| ID | Dette | Impact | Description & Détail |
|---|---|---|---|
| **D01** | **Monolithe Géant `App.tsx`** | 🚫 Maintenabilité | 850 lignes de code fusionnant les types, les mocks de données (`CLIENTS`, `DOCUMENTS`, `AGENTS`), les sous-composants réutilisables (`Badge`, `Card`) et les 7 écrans métier entiers. Si on souhaite modifier un détail de la vue SOP ou Finance, on doit altérer ce fichier unique. Risques élevés de conflits de merge. |
| **D02** | **Absence de Modularité des Vues** | ⚠️ Évolutivité | Les composants `DashboardView`, `ClientsView`, `DocumentsView`, `AgentsView`, `FinanceView`, `SOPLibraryView` et `SettingsView` ne sont pas exportés et résident tous dans le même fichier, empêchant leur réutilisation. |
| **D03** | **Zéro Persistance des États** | ⚠️ Business / UX | La création de nouveaux clients, de nouvelles factures, de tâches ou d'exécutions d'agents s'effectue uniquement en mémoire volatile. Tout s'efface lors d'un rafraîchissement. |
| **D04** | **Routage Volatile (useState)** | 🔧 SEO & Partage | La navigation s'effectue par état React (`activeTab`). Impossible de naviguer directement vers `http://localhost:3000/agents` ou de recharger sur la bonne section. |

### 🟡 MEDIUM — Dettes Qualité & Design System

| ID | Dette | Impact | Description & Détail |
|---|---|---|---|
| **D05** | **CSS Vide & Absence de Thème Global** | 🔧 Design System | Le fichier `index.css` de 23 octets ne définit aucune classe utilitaire ou variable du Design System premium A'Space (pas de `.glass-panel`, `.shadow-soft`, scrollbars personnalisés). Tout le style est écrit ad-hoc. |
| **D06** | **Pas de Balises SEO ni Favicon** | 🔧 SEO / OG | Titre de page par défaut ("React App") et aucune balise meta SEO/Open Graph de marque. |
| **D07** | **Dépendances Express non matérialisées** | 🔧 Propreté | Le `package.json` contient `express` et `@types/express` mais aucun fichier serveur de production n'est écrit pour servir le build en production de manière souveraine. |

---

## 3. Score de Maturité Déploiement

```
 CATÉGORIE                    SCORE    CIBLE (Next/Vite-split)
 ─────────────────────────── ──────── ─────────────────────────
 Build Pipeline               8 / 10           10  (Vite 6 déjà actif !)
 Versionning (Git/GitHub)     2 / 10           10  (Intégré au mono-repo parent)
 SEO / SSR                    2 / 10            8
 Performance (Lighthouse)     6 / 10            9
 Backend / API / Persistence  0 / 10            7
 Tests                        0 / 10            6
 Sécurité                     4 / 10            8
 Design System / CSS          5 / 10           10  (CSS trop brut, manque de variables)
 Qualité du Contenu           9 / 10           10  (Mocks hyper-complets et pros !)
 ─────────────────────────── ──────── ─────────────────────────
 TOTAL                       41 / 100          88 / 100
```

> [!IMPORTANT]
> **Verdict Flash (Maturité : 41%)** : Le projet possède une excellente base moderne et compilable (Vite 6 + TS + Tailwind v4). Cependant, l'architecture est **totalement monolithique (D01/D02)**. Il requiert un découpage et une modularisation stricte avant d'être déployé en production ou enrichi avec de vraies fonctionnalités.

---

## 4. Plan de Correction en 6 Phases (Solaris Pattern)

### 🎯 Architecture Cible (Découpage Modulaire)

```
src/
├── main.tsx
├── index.css                 # Design System A'Space, variables et utilitaires
├── App.tsx                   # Squelette de navigation et Routage de base
├── lib/
│   ├── types.ts              # Types et interfaces partagés
│   └── constants.ts          # Mocks de données et configurations d'agents
└── components/
    ├── Badge.tsx             # Composant UI
    ├── Card.tsx              # Composant UI
    ├── ProgressBar.tsx       # Composant UI
    └── views/                # Vues métier modulaires
        ├── DashboardView.tsx
        ├── ClientsView.tsx
        ├── DocumentsView.tsx
        ├── AgentsView.tsx
        ├── FinanceView.tsx
        ├── SOPLibraryView.tsx
        └── SettingsView.tsx
```

---

### Phase 1 : Modularisation & Découpage (Dettes D01, D02)
*Objectif : Découper le fichier unique `App.tsx` en 12 fichiers indépendants, isoler les types et garantir un typage 100% strict.*

1. **Extraction des Types** : Créer `src/lib/types.ts` et y exporter l'ensemble des types métier.
2. **Extraction des Données Statiques** : Créer `src/lib/constants.ts` et y loger les constantes (`CLIENTS`, `DOCUMENTS`, `AGENTS`, `INVOICES`, `SOPS`).
3. **Création des Composants UI** : Créer `src/components/Badge.tsx`, `src/components/Card.tsx`, `src/components/ProgressBar.tsx`.
4. **Extraction des Vues Métier** :
   - Créer `src/components/views/DashboardView.tsx`, `ClientsView.tsx`, `DocumentsView.tsx`, `AgentsView.tsx`, `FinanceView.tsx`, `SOPLibraryView.tsx`, `SettingsView.tsx`.
   - Y intégrer les imports d'alias propres (`@/lib/types`, `@/lib/constants`, `@/components/Card`).
5. **Nettoyage de `App.tsx`** :
   - Réfacter `src/App.tsx` pour ne conserver que la barre latérale de navigation et l'injection dynamique des vues importées.

### Phase 2 : Design System, SEO & Polish (Dettes D05, D06)
*Objectif : Injecter le Design System A'Space et corriger le SEO global.*

1. **Variables & Design System** : Enrichir `src/index.css` avec le thème visuel A'Space (variables de couleurs HSL harmonieuses et classes `.glass-panel`, `.shadow-soft`, custom scrollbars).
2. **Meta SEO & Favicon** : Modifier `index.html` pour injecter des métadonnées SEO/OG propres à l'OS "OMK Services Business OS" et remplacer le favicon générique.

### Phase 3 : Persistance Client-Side (Dette D03)
*Objectif : Raccorder les interactions locales à l'API `localStorage`.*

1. **Persistance des clients** (`localStorage` pour la liste des cas actifs, permettant d'ajouter réellement un client sans perte au reload).
2. **Persistance des documents & signatures** (état persistant des signatures sur les contrats OMK).
3. **Persistance des exécutions d'agents** (historique des activations d'agents Swarm).

### Phase 4 : Serveur Souverain & Docker (Dette D07)
*Objectif : Assurer le déploiement sur VPS souverain Dokploy.*

1. **Serveur de Production Express** : Écrire `server.js` (ou `src/server.ts`) pour servir proprement le build statique optimisé généré par Vite en mode de production souverain.
2. **Configuration Docker** :
   - Créer un `Dockerfile` multi-stage (Node.js build + Node.js Express server) pour un build ultraléger.
   - Créer un fichier `docker-compose.yml` prêt pour le déploiement souverain.

### Phase 5 : Exécution Autonome & Validation Localhost
*Objectif : Mettre en œuvre chaque phase en autonomie complète et lancer le projet localement.*

1. **Installation des Dépendances** : Installer l'ensemble des dépendances NPM nécessaires du projet.
2. **Type Check strict** : Lancer la validation TypeScript (`npx tsc --noEmit`) pour garantir zéro erreur de compilation sur la nouvelle structure modulaire.
3. **Lancement Localhost** : Démarrer le serveur de développement local et valider que l'interface OMK Services Business OS répond parfaitement en local sur `http://localhost:3000` (ou port libre).

### Phase 6 : Versionning GitHub & Handoff Humain (Human-in-the-loop)
*Objectif : Publier le code modulaire propre sur un dépôt GitHub souverain.*

1. **Vérification Git** : Initialiser Git localement si ce n'est pas déjà fait.
2. **Demande Interactive (HITL)** : Solliciter explicitement le commanditaire humain pour fournir l'URL du repository distant GitHub cible (`https://github.com/...`).
3. **Commit & Push** : Effectuer un commit conventionnel propre (`feat: modularize App.tsx monolith into clean views`) et pousser le code sur la branche principale (`master` ou `main`).

---

## 5. Décision Requise & Validation A0

> [!IMPORTANT]
> ### 🚨 Questions de validation pour A0 (Amadeus / Commanditaire) :
> 
> 1. **Modularisation immédiate ?**
>    - Souhaitez-vous que nous exécutions le découpage du monolithe de 850 lignes en composants propres et isolés avant toute autre opération ? (Fortement recommandé pour la pérennité du code).
> 
> 2. **Liaisons de Persistance ?**
>    - Validons-nous la persistance légère locale via `localStorage` pour les clients, documents et statuts d'agents (immédiat, souverain et sans configuration de serveurs de bases de données) ?
> 
> 3. **Thématique Visuelle** :
>    - Doit-on conserver la couleur primaire d'origine (`emerald-500`) ou appliquer les standards raffinés du thème du Digital Garden A'Space (stone et teintes HSL d'émeraude douce) ?

---

*Ce document d'audit Project Picard a été rédigé avec rigueur et déposé à la racine du projet. En attente de validation A0 pour le lancement de la Phase 1.*
