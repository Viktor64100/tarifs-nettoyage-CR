import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — NextCall",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-[640px] mx-auto px-5 py-10 leading-relaxed">
      <Link href="/" className="text-accent text-sm font-medium">
        ← Retour
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight mt-4 mb-1">
        Politique de confidentialité
      </h1>
      <p className="text-faint text-sm mb-6">Dernière mise à jour : 28 juillet 2026</p>

      <div className="bg-amber/10 border border-amber/30 rounded-2xl px-4 py-3.5 mb-8 text-sm text-sub">
        <strong className="text-amber">Modèle à valider avant mise en ligne.</strong> Ce document est un point de
        départ, pas un conseil juridique. Les mentions entre crochets <code>[…]</code> doivent être complétées avec
        les informations réelles de l&apos;éditeur du service, et l&apos;ensemble doit être relu par un juriste avant
        le lancement — en particulier au regard de la loi n° 2025-594 du 30/06/2025 sur le démarchage téléphonique
        (entrée en vigueur le 11 août 2026).
      </div>

      <Section title="1. Qui sommes-nous ?">
        <p>
          NextCall est édité par <strong>Dylan Verdier</strong>, entrepreneur individuel (micro-entreprise), SIRET
          934 893 272 00013, dont le siège est situé 7 rue du Professeur Calmette, 06240 Beausoleil, France.
          Responsable du traitement des données au sens du RGPD : Dylan Verdier.
        </p>
        <p className="mt-2">
          Contact pour toute question relative à vos données : <strong>dylanverdier0@gmail.com</strong>.
        </p>
      </Section>

      <Section title="2. Deux catégories de données concernées">
        <p>
          NextCall traite deux types de données personnelles, avec des rôles différents au sens du RGPD :
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Vos données de compte</strong> (utilisateur de NextCall) : nom, email, entreprise, mot de passe
            (chiffré), informations d&apos;abonnement. NextCall est ici <strong>responsable du traitement</strong>.
          </li>
          <li>
            <strong>Les données de vos prospects</strong>, que vous importez ou saisissez vous-même : nom, téléphone,
            email, entreprise, secteur, statut, historique d&apos;appels, notes, et informations de consentement au
            démarchage. Pour ces données, <strong>vous êtes responsable du traitement</strong> et NextCall agit comme{" "}
            <strong>sous-traitant</strong> au sens de l&apos;article 28 du RGPD : nous hébergeons et traitons ces
            données pour votre compte, selon vos instructions, et ne les utilisons à aucune autre fin.
          </li>
        </ul>
      </Section>

      <Section title="3. Pourquoi collectons-nous ces données ?">
        <ul className="list-disc pl-5 space-y-1">
          <li>Fournir le service : gérer votre file d&apos;appels, votre historique, vos relances.</li>
          <li>Gérer votre abonnement et la facturation (via Stripe).</li>
          <li>
            Le résumé assisté par IA : si vous utilisez la note vocale, le texte transcrit est envoyé à OpenAI pour
            générer un résumé, des mots-clés et une suggestion de relance. Cette suggestion vous est toujours
            présentée pour validation — elle n&apos;est jamais enregistrée automatiquement sans votre accord.
          </li>
          <li>Assurer la sécurité et le bon fonctionnement technique du service.</li>
        </ul>
      </Section>

      <Section title="4. Base légale">
        <p>
          Vos données de compte sont traitées sur la base de l&apos;exécution du contrat (conditions
          d&apos;utilisation de NextCall). Les données de vos prospects sont traitées pour votre compte, sur la base
          légale que <strong>vous</strong> avez identifiée (consentement pour un particulier depuis le 11 août 2026,
          ou intérêt légitime pour une prospection B2B) — NextCall trace cette information mais ne la détermine pas à
          votre place.
        </p>
      </Section>

      <Section title="5. Qui a accès à ces données ?">
        <p>Vos données ne sont jamais vendues. Elles sont partagées uniquement avec nos sous-traitants techniques :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Supabase</strong> (hébergement de la base de données et authentification).</li>
          <li><strong>Stripe</strong> (traitement des paiements — NextCall ne stocke aucune donnée bancaire).</li>
          <li><strong>OpenAI</strong> (résumé et transcription des notes vocales, uniquement le texte que vous soumettez).</li>
          <li><strong>Vercel</strong> (hébergement de l&apos;application).</li>
        </ul>
        <p className="mt-2">
          Certains de ces prestataires sont situés hors de l&apos;Union européenne (États-Unis). Le cas échéant, les
          transferts s&apos;appuient sur les garanties prévues par ces prestataires (clauses contractuelles types ou
          équivalent) — [à détailler/vérifier auprès de chaque sous-traitant avant lancement].
        </p>
      </Section>

      <Section title="6. Combien de temps conservons-nous vos données ?">
        <p>
          Les données de compte et de prospects sont conservées tant que votre compte est actif. En cas de
          suppression de compte, les données sont supprimées ou anonymisées sous [délai à définir, ex. 30 jours],
          sauf obligation légale de conservation plus longue (ex. facturation).
        </p>
      </Section>

      <Section title="7. Vos droits">
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          limitation, de portabilité et d&apos;opposition sur vos données. Pour l&apos;exercer, contactez{" "}
          <strong>dylanverdier0@gmail.com</strong>. Vous pouvez également introduire une réclamation auprès de la CNIL
          (cnil.fr).
        </p>
        <p className="mt-2">
          Si vous êtes un prospect dont les données sont présentes dans NextCall via l&apos;un de nos clients,
          adressez votre demande directement à ce client — c&apos;est lui qui reste responsable de vos données.
        </p>
      </Section>

      <Section title="8. Sécurité">
        <p>
          L&apos;accès aux données est cloisonné par utilisateur au niveau de la base de données (Row Level Security)
          : un client de NextCall ne peut techniquement pas accéder aux données d&apos;un autre. Les échanges sont
          chiffrés (HTTPS) et les mots de passe ne sont jamais stockés en clair.
        </p>
      </Section>

      <Section title="9. Cookies">
        <p>
          NextCall utilise uniquement des cookies techniques indispensables au fonctionnement (maintien de votre
          session de connexion). Aucun cookie publicitaire ou de traçage tiers n&apos;est déposé à ce jour.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Pour toute question relative à cette politique ou à vos données : <strong>dylanverdier0@gmail.com</strong>.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sub text-[15px]">{children}</div>
    </section>
  );
}
