# NextCall

L'assistant qui organise la prospection téléphonique — **pas un CRM**. On importe des prospects, on appelle, on enregistre le résultat en moins de 10 secondes, la relance se programme toute seule.

Ce dépôt est une **charpente de production**, pas l'app finie. L'architecture (base de données, auth, Stripe, IA) est posée. Les écrans sont à construire — c'est le travail délégué à Claude Code, en s'appuyant sur deux références :

- **`docs/nextcall-prototype.jsx`** — le prototype fonctionnel : c'est la **spec visuelle et d'interaction** (design, flux d'appel, palette, micro-copie). À porter écran par écran.
- **`supabase/migrations/0001_init.sql`** — le **contrat de données**. Tout écran lit/écrit à travers ce schéma, jamais autrement.

---

## Stack

Next.js 15 (App Router) · React 19 · Tailwind CSS v4 (config CSS-first) · Supabase (Postgres + Auth + RLS + Storage) · Stripe (abonnement) · OpenAI (résumé + transcription) · déploiement Vercel.

## Architecture en une minute

- **Multi-tenant par RLS.** Chaque ligne porte un `user_id` ; les politiques Postgres garantissent que personne ne lit les données d'un autre. La sécurité est dans la base, pas dans le code.
- **3 tables** : `profiles` (1:1 avec `auth.users`, essai/abonnement), `prospects` (avec le bloc **consentement**), `interactions` (l'historique — une ligne par appel logué).
- **La file d'appels** est la vue SQL `call_queue` : nouveaux prospects + relances dues, triés. C'est elle qui répond à « qui appeler ensuite ».
- **L'IA ne fait que proposer** (règle d'or #4) : elle renvoie un résumé + une action + une date de relance ; l'utilisateur valide.

## Installation

```bash
# 1. Dépendances
npm install

# 2. Supabase : créer un projet sur supabase.com, puis appliquer la migration
#    (SQL Editor -> coller supabase/migrations/0001_init.sql -> Run)
#    ou via la CLI : supabase link && supabase db push

# 3. Stripe : créer un produit "NextCall" à 15 €/mois (récurrent), récupérer le price_id.
#    En local, écouter les webhooks :
npm run stripe:listen        # copie le whsec_... dans .env.local

# 4. Variables d'environnement
cp .env.local.example .env.local     # puis remplir les clés

# 5. Lancer
npm run dev
```

Générer les types TS depuis la base (recommandé) :
```bash
npx supabase gen types typescript --project-id <ref> > types/supabase.ts
```

---

## Feuille de route — 3 à 4 semaines (ordre de build pour Claude Code)

> Principe directeur : livrer d'abord **la boucle centrale utilisable**, le reste ensuite.
> Chaque appel doit s'enregistrer en < 10 s ; l'utilisateur doit toujours savoir qui appeler ensuite.

### Semaine 1 — Auth, coquille, données
- [ ] Brancher l'auth Supabase : inscription, connexion, déconnexion, mot de passe oublié. (login/signup déjà présents.)
- [ ] Porter la coquille du prototype : barre d'onglets, jetons de design (`globals.css` les contient déjà), typographie.
- [ ] Prospects CRUD sur la base (liste, feuille d'ajout, détail, édition, suppression) — s'appuyer sur le RLS.
- [ ] Import : coller / CSV.

### Semaine 2 — La boucle centrale (le cœur du produit)
- [ ] Dashboard : stats du jour (appels/relances/RDV), progression de l'objectif, requête `call_queue`.
- [ ] Flux d'appel : carte focalisée, lien `tel:`, les 6 résultats, programmation de relance → écrit une `interaction` **et** met à jour `prospects.next_follow_up_at` + `status`.
- [ ] Historique en timeline depuis `interactions`.
- [ ] **Consentement** : badge + saisie partout (voir conformité ci-dessous).

### Semaine 3 — IA, facturation, finitions
- [ ] Note vocale : enregistrer → transcrire (dictée navigateur *ou* `/api/ai/transcribe`) → `/api/ai/summarize` → pré-remplir résumé/tags/action/date. L'utilisateur valide.
- [ ] Stripe : checkout (`/api/stripe/checkout`), webhook (déjà là), **gating** de fin d'essai (bloquer si `plan` non actif et `trial_ends_at` dépassé → page facturation), portail client.
- [ ] Recherche instantanée, écran statistiques, export CSV, états vides/erreurs.

### Semaine 4 — Durcissement & lancement
- [ ] QA mobile (l'app est mobile-first), focus clavier, `prefers-reduced-motion`.
- [ ] Politique de confidentialité + registre de traitement RGPD (on stocke des données personnelles de tiers).
- [ ] Déploiement Vercel, webhook Stripe en prod, domaine.

---

## ⚠️ Conformité — exigence produit, pas une option

Depuis le **11 août 2026**, le démarchage téléphonique d'un **particulier (B2C)** en France exige un **consentement préalable** (opt-in) ; la preuve incombe au professionnel (loi n° 2025-594 du 30/06/2025 ; amende jusqu'à 375 000 € pour une personne morale, contrats annulables). C'est pourquoi le schéma trace `consent_given` / `consent_at` / `consent_source`.

- **Cible B2B** (agences, consultants, hôtellerie/immobilier pro…) : régime RGPD (intérêt légitime, opt-out) — le champ consentement est alors un signal de sérieux.
- **Cible B2C** : le consentement tracé est **obligatoire** ; envisager d'en faire un argument central (« prospection conforme 2026 »).

À valider avec un juriste avant lancement. Rien ici ne constitue un conseil juridique.

## Fichiers déjà écrits (à ne pas réinventer)

`supabase/migrations/0001_init.sql` · `middleware.ts` · `lib/supabase/*` · `lib/stripe.ts` · `lib/openai.ts` · `app/api/stripe/{checkout,webhook}` · `app/api/ai/{summarize,transcribe}` · `app/{login,signup}` · `app/(app)/{layout,dashboard,prospects}` (dashboard = le patron de câblage des données à répliquer) · `types/db.ts`.
