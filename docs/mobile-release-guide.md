# Publier NextCall sur l'App Store et le Play Store

## Où on en est

Le code natif est prêt et versionné (`android/`, `ios/`, `capacitor.config.ts`).
L'app charge `https://nextcall.tech` dans une coque WebView native (nécessaire
car l'app web utilise des Server Actions/SSR, incompatibles avec un export
statique). Le pipeline CI `.github/workflows/mobile-build.yml` compile les
deux plateformes automatiquement à chaque push sur `main` :

- **Android** : produit toujours un APK debug (installable directement sur un
  téléphone Android pour tester, aucun compte requis).
- **iOS** : compile toujours pour le simulateur (validation que le build ne
  casse pas, aucun compte requis — mais ça ne produit pas d'app installable
  sur un iPhone physique, Apple l'exige signée).

Ces deux étapes tournent dès maintenant, sans rien à configurer. Pour aller
jusqu'à une app installable/publiable, il faut la signature — ce qui demande
les comptes développeur ci-dessous.

## 1. Comptes à créer (obligatoire, à faire vous-même)

| Compte | Coût | Lien |
|---|---|---|
| Apple Developer Program | 99 $/an | developer.apple.com/programs |
| Google Play Console | 25 $ (une fois) | play.google.com/console/signup |

Comptez 24-48h pour la validation du compte Apple (parfois plus si vérification d'identité).

## 2. Android — signature et publication

### Générer le keystore de signature

```bash
keytool -genkey -v -keystore nextcall-release.keystore \
  -alias nextcall -keyalg RSA -keysize 2048 -validity 10000
```

Gardez ce fichier et son mot de passe **en lieu sûr** — sans lui, impossible
de publier une mise à jour de l'app (Google refuse un keystore différent pour
la même `applicationId`).

### Ajouter les secrets GitHub

Dans le repo GitHub → Settings → Secrets and variables → Actions, ajouter :

- `ANDROID_KEYSTORE_BASE64` : `base64 -i nextcall-release.keystore | pbcopy` (ou équivalent)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS` (`nextcall` ci-dessus)
- `ANDROID_KEY_PASSWORD`

Une fois ces 4 secrets présents, le job `android-debug` du workflow produit
aussi automatiquement un `.aab` signé (artifact `android-release-aab`).

### Publier

1. Play Console → Créer une application (nom : NextCall, catégorie : Business/Productivité).
2. Renseigner la fiche : description, captures d'écran (au moins téléphone, 2-8 images), icône 512×512 (déjà générée : `resources/icon.png`), bannière.
3. Classification du contenu, section "Sécurité des données" (les données collectées : email, téléphone des prospects — voir `docs/registre-traitement-rgpd.md` pour la liste exacte).
4. Lien politique de confidentialité : `https://nextcall.tech/privacy` (déjà en ligne).
5. Uploader le `.aab` téléchargé depuis l'artifact GitHub Actions dans une piste de test interne d'abord, puis production après validation.

## 3. iOS — signature et publication

C'est la partie la plus fastidieuse d'Apple. Il faut, dans App Store Connect
(après activation du compte développeur) :

### Créer l'App ID et le certificat

1. developer.apple.com/account → Certificates, Identifiers & Profiles.
2. Identifiers → + → App ID `tech.nextcall.app` (déjà utilisé dans le projet Xcode, à faire correspondre exactement).
3. Certificates → + → "Apple Distribution" → suivre le flux (génère une paire de clés via Keychain Access sur un Mac, ou via `openssl` si vous n'en avez pas — dites-le-moi si besoin, je peux détailler la méthode sans Mac).
4. Profiles → + → "App Store Connect" → sélectionner l'App ID et le certificat → télécharger le `.mobileprovision`.

### Récupérer votre Team ID

developer.apple.com/account → Membership → Team ID (10 caractères). Remplacer
`REPLACE_WITH_APPLE_TEAM_ID` dans `ios/ExportOptions.plist` par cette valeur.

### Ajouter les secrets GitHub

- `IOS_DIST_CERTIFICATE_BASE64` : export du certificat + clé privée en `.p12` (Keychain Access → clic droit sur le certificat → Exporter), puis `base64 -i cert.p12`
- `IOS_DIST_CERTIFICATE_PASSWORD` : le mot de passe choisi à l'export du `.p12`
- `IOS_PROVISION_PROFILE_BASE64` : `base64 -i profile.mobileprovision`

Une fois ces 3 secrets présents (et le Team ID mis à jour dans `ExportOptions.plist`),
le job `ios-build` produit un `.ipa` signé (artifact `ios-release-ipa`).

### Créer la fiche App Store Connect

1. appstoreconnect.apple.com → Mes apps → + → Nouvelle app.
2. Bundle ID : `tech.nextcall.app`, SKU libre (ex. `nextcall-001`).
3. Fiche : description, mots-clés, captures d'écran par taille d'écran requise (6.7", 6.5", 5.5" minimum — un simulateur suffit pour les générer, `xcrun simctl` + capture).
4. "App Privacy" (nutrition label) : déclarer la collecte de données de contact des prospects, email du compte, données de facturation (Stripe) — cohérent avec `docs/registre-traitement-rgpd.md`.
5. Uploader le `.ipa` : soit via Xcode/Transporter sur un Mac, soit via `xcrun altool` / `xcrun notarytool` en CI (peut être ajouté au workflow une fois les secrets `APP_STORE_CONNECT_API_KEY` créés — étape suivante si vous voulez automatiser jusqu'au bout).
6. TestFlight : tester avec quelques comptes avant la review publique.
7. Soumettre à la review (délai habituel 24-48h).

## 4. Points d'attention review Apple

- Guideline 4.2 (Minimum Functionality) : le risque "juste un site web enveloppé"
  est atténué par le retour haptique natif déjà branché (`lib/native.ts`) et
  l'usage natif du micro/dictée. Si Apple rejette quand même sur ce motif,
  la réponse standard est de souligner ces capacités natives dans les notes
  de review.
- Le lien de désinscription/suppression de compte (RGPD, déjà en place dans
  Réglages) est requis par Apple pour toute app avec compte utilisateur.
- Renseigner une URL de support et une politique de confidentialité (déjà faites).

## 5. Automatiser jusqu'à l'upload store (optionnel, étape suivante)

Le workflow actuel s'arrête à produire un `.aab`/`.ipa` signé en artifact
téléchargeable. Pour l'upload automatique vers Play Console / App Store
Connect à chaque release, il faudrait ajouter :

- Android : un compte de service Google Play (JSON) + `fastlane supply` ou l'action `r0adkll/upload-google-play`.
- iOS : une clé API App Store Connect (`APP_STORE_CONNECT_API_KEY`) + `xcrun altool --upload-app` ou `fastlane pilot upload`.

Dites-moi quand vous avez les comptes et je complète le workflow pour cette dernière étape.
