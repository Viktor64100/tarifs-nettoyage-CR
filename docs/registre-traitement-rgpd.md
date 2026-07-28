# Registre des activités de traitement — NextCall

> **Document interne**, à conserver par l'éditeur du service (article 30 du RGPD).
> Il ne s'agit pas d'un conseil juridique : à compléter avec les informations réelles de l'entreprise
> et à faire valider par un juriste ou un DPO avant le lancement commercial.
>
> Dernière mise à jour : [à compléter]
> Responsable du registre : [nom / fonction]

---

## 1. Identité du responsable de traitement

| Champ | Valeur |
|---|---|
| Raison sociale | [à compléter] |
| Forme juridique | [à compléter] |
| SIREN/SIRET | [à compléter] |
| Adresse du siège | [à compléter] |
| Représentant légal | [à compléter] |
| Délégué à la protection des données (DPO) | [à compléter — non obligatoire pour une petite structure sauf traitement à grande échelle] |
| Contact données personnelles | [email à compléter] |

---

## 2. Traitement n°1 — Gestion des comptes utilisateurs (clients de NextCall)

| Champ | Détail |
|---|---|
| Finalité | Créer et gérer le compte d'un client NextCall, fournir l'accès au service. |
| Base légale | Exécution du contrat (CGU / abonnement). |
| Personnes concernées | Utilisateurs professionnels de NextCall (les clients). |
| Catégories de données | Nom, email, mot de passe (haché, non lisible), entreprise, objectif d'appels, statut d'abonnement (`profiles`). |
| Destinataires internes | Éditeur de NextCall (support). |
| Sous-traitants | Supabase (hébergement base de données + authentification). |
| Durée de conservation | Durée du compte + [délai à définir, ex. 30 jours] après suppression, sauf obligations comptables. |
| Mesures de sécurité | Row Level Security (isolation par utilisateur au niveau base de données), mots de passe hachés par Supabase Auth, connexions chiffrées (TLS). |
| Transfert hors UE | Selon la région d'hébergement Supabase choisie — [à vérifier / documenter la région du projet]. |

---

## 3. Traitement n°2 — Prospection téléphonique (données des prospects)

**NextCall agit ici comme sous-traitant (article 28 RGPD) : le client de NextCall reste responsable de traitement pour les données de ses propres prospects.**

| Champ | Détail |
|---|---|
| Finalité | Permettre au client de NextCall d'organiser et tracer sa prospection téléphonique (file d'appels, relances, historique). |
| Base légale (déterminée par le client, pas par NextCall) | Consentement préalable pour un particulier (B2C, obligatoire depuis la loi n° 2025-594 du 30/06/2025, entrée en vigueur le 11/08/2026) ou intérêt légitime pour une prospection B2B. |
| Personnes concernées | Prospects du client (particuliers ou professionnels démarchés). |
| Catégories de données | Nom, prénom, téléphone, email, entreprise, secteur, statut, date de relance, **preuve de consentement** (`consent_given`, `consent_at`, `consent_source`), historique d'appels et notes (`interactions`). |
| Données sensibles | Aucune donnée sensible (art. 9 RGPD) collectée par construction du produit. |
| Destinataires | Le client de NextCall uniquement (isolation stricte par RLS — aucun autre client n'y a accès). |
| Sous-traitants ultérieurs | Supabase (hébergement), OpenAI (uniquement si la note vocale est utilisée — voir traitement n°4). |
| Durée de conservation | Durée du compte client + [délai à définir]. Le client reste responsable de purger les données de prospects n'ayant plus de raison d'être conservées (ex. opposition, refus de consentement persistant). |
| Mesures de sécurité | RLS Postgres, chiffrement en transit, journal d'audit du consentement (`consent_source`, horodatage). |
| Remarque de conformité | NextCall fournit l'outil de traçabilité du consentement mais ne recueille pas le consentement à la place du client — c'est au client de s'assurer que le consentement est valablement obtenu avant tout appel. |

---

## 4. Traitement n°3 — Facturation et abonnement

| Champ | Détail |
|---|---|
| Finalité | Facturer l'abonnement mensuel du client, gérer les paiements et leur suivi. |
| Base légale | Exécution du contrat. |
| Personnes concernées | Utilisateurs abonnés. |
| Catégories de données | Email, identifiant client Stripe, identifiant d'abonnement, statut de paiement. **Aucune donnée bancaire n'est stockée par NextCall** — elle transite directement vers Stripe. |
| Sous-traitant | Stripe, Inc. (paiement). |
| Durée de conservation | Durée de l'abonnement + durée légale de conservation des documents comptables (en France : 10 ans pour les pièces comptables). |
| Transfert hors UE | Oui (Stripe, États-Unis) — encadré par les clauses contractuelles types de Stripe. [à vérifier dans le DPA Stripe en vigueur] |

---

## 5. Traitement n°4 — Assistance IA (résumé de note vocale)

| Champ | Détail |
|---|---|
| Finalité | Aider l'utilisateur à résumer une note d'appel dictée : résumé, mots-clés, action suggérée, date de relance suggérée. |
| Base légale | Intérêt légitime (fonctionnalité optionnelle, activée à la demande de l'utilisateur) + exécution du contrat. |
| Déclenchement | Uniquement si l'utilisateur choisit d'utiliser la dictée + le résumé IA. La transcription elle-même s'effectue si possible dans le navigateur (Web Speech API), sans passer par un serveur tiers. |
| Personnes concernées | Prospects mentionnés dans la note dictée par l'utilisateur. |
| Catégories de données transmises | Le texte de la note (peut mentionner le nom du prospect, contexte de l'échange). Aucune donnée n'est transmise sans action explicite de l'utilisateur (bouton "Résumer avec l'IA"). |
| Sous-traitant | OpenAI, L.L.C. (API `gpt-4o-mini`). |
| Validation humaine | Le résumé proposé n'est enregistré qu'après validation explicite de l'utilisateur (règle d'or du produit : l'IA propose, l'utilisateur valide). |
| Durée de conservation | Le résumé validé est conservé comme le reste de l'historique d'appel. Côté OpenAI : traitement transitoire pour la génération de la réponse — [vérifier la politique de rétention API en vigueur chez OpenAI et si l'option "zero data retention" est disponible/activée]. |
| Transfert hors UE | Oui (OpenAI, États-Unis) — [à documenter selon le DPA OpenAI en vigueur]. |

---

## 6. Sous-traitants (vue d'ensemble)

| Sous-traitant | Rôle | Données concernées | Localisation | Garanties |
|---|---|---|---|---|
| Supabase | Hébergement base de données + authentification | Toutes les données de l'application | Selon région du projet choisie | [à documenter] |
| Stripe | Paiement et facturation | Données de facturation, email | États-Unis / UE selon config | Clauses contractuelles types |
| OpenAI | Résumé IA des notes d'appel | Texte des notes (si fonctionnalité utilisée) | États-Unis | [à documenter] |
| Vercel | Hébergement de l'application web | Toutes (infrastructure) | [à documenter selon config Vercel] | [à documenter] |

---

## 7. Droits des personnes concernées

Voir la politique de confidentialité publiée sur le site (route `/privacy`, fichier `app/privacy/page.tsx`) pour la procédure d'exercice des droits (accès, rectification, effacement, limitation, portabilité, opposition) et le contact dédié.

Pour les prospects dont les données figurent dans NextCall via un client, la demande doit être adressée à ce client (responsable de traitement pour ces données), qui peut la relayer à l'éditeur de NextCall si nécessaire (ex. suppression technique).

## 8. Violations de données

En cas de violation de données personnelles, l'éditeur de NextCall s'engage à :
1. Documenter l'incident (nature, données concernées, personnes touchées).
2. Notifier la CNIL sous 72h si la violation présente un risque pour les personnes concernées (art. 33 RGPD).
3. Informer les clients concernés (en tant que responsables de traitement pour les données de leurs prospects) dans les meilleurs délais, conformément à l'article 28.3.f du RGPD.
4. Informer les personnes concernées directement si le risque est élevé (art. 34 RGPD).

---

*Ce registre doit être revu et mis à jour à chaque évolution significative du produit (nouvelle fonctionnalité traitant des données personnelles, nouveau sous-traitant, etc.).*
