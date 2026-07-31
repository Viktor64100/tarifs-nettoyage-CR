"use client";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { ShieldAlert, ShieldCheck, CreditCard, Check, Sparkles, ExternalLink } from "lucide-react";
import type { PlanStatus } from "@/types/db";

// L'app mobile (coque Capacitor) charge nextcall.tech en direct — le même code
// tourne donc sur web et sur mobile. Sur mobile, on ne propose jamais le
// paiement Stripe dans la coque native (risque de rejet App Store/Play Store
// pour contournement d'IAP) : on redirige vers le navigateur système à la place.
const BILLING_URL = "https://nextcall.tech/billing";

const PLAN_LABEL: Record<PlanStatus, string> = {
  trial: "Essai",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Annulé",
};

const INCLUDED = [
  "Prospects et relances illimités",
  "Résumé et suggestions par IA après chaque appel",
  "Suivi du consentement RGPD intégré",
  "Statistiques et export CSV",
];

type Interval = "annual" | "monthly";

export default function BillingScreen({
  plan,
  trialEndsAt,
  hasStripeCustomer,
}: {
  plan: PlanStatus;
  trialEndsAt: string | null;
  hasStripeCustomer: boolean;
}) {
  const [loadingAction, setLoadingAction] = useState<Interval | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  async function openInBrowser() {
    await Browser.open({ url: BILLING_URL });
  }

  const daysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;
  const trialExpired = plan !== "active" && daysLeft !== null && daysLeft < 0;

  async function subscribe(interval: Interval) {
    setError(null);
    setLoadingAction(interval);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Action impossible pour le moment.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible pour le moment.");
      setLoadingAction(null);
    }
  }

  async function openPortal() {
    if (isNative) return openInBrowser();
    setError(null);
    setLoadingAction("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Action impossible pour le moment.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible pour le moment.");
      setLoadingAction(null);
    }
  }

  return (
    <div className="px-5 pt-7 pb-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-4">Facturation</h1>

      <div className="bg-card border border-line rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          {plan === "active" ? (
            <ShieldCheck size={19} className="text-accent" />
          ) : (
            <ShieldAlert size={19} className={trialExpired ? "text-red" : "text-amber"} />
          )}
          <span className="font-semibold text-[15px]">Statut : {PLAN_LABEL[plan]}</span>
        </div>
        <p className="text-sub text-sm mt-1.5 leading-relaxed">
          {plan === "active" &&
            "Ton abonnement NextCall est actif. Gère-le, change de moyen de paiement ou résilie depuis le portail Stripe."}
          {plan !== "active" &&
            daysLeft !== null &&
            daysLeft >= 0 &&
            `Il te reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai gratuit.`}
          {plan !== "active" &&
            trialExpired &&
            "Ton essai gratuit est terminé. Abonne-toi pour continuer à utiliser NextCall."}
          {plan === "past_due" && " Un paiement a échoué — mets à jour ton moyen de paiement."}
        </p>
      </div>

      {error && <p className="text-red text-sm mb-3">{error}</p>}

      {plan !== "active" && isNative && (
        <div className="flex flex-col gap-2.5 mb-4">
          <ul className="flex flex-col gap-1.5 mb-1 px-0.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sub text-[13.5px]">
                <Check size={15} className="text-accent shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          <div className="bg-card border border-line rounded-2xl p-4">
            <p className="text-sm leading-relaxed">
              L&apos;abonnement se gère depuis ton navigateur, sur{" "}
              <span className="font-medium">nextcall.tech</span>.
            </p>
            <button
              onClick={openInBrowser}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-xl py-3 font-semibold text-[15px] mt-3.5"
            >
              <ExternalLink size={16} /> Ouvrir nextcall.tech
            </button>
          </div>
        </div>
      )}

      {plan !== "active" && !isNative && (
        <div className="flex flex-col gap-2.5 mb-4">
          <ul className="flex flex-col gap-1.5 mb-1 px-0.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sub text-[13.5px]">
                <Check size={15} className="text-accent shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          <div className="relative bg-accent-soft border-2 border-accent rounded-2xl p-4 pt-5">
            <span className="absolute -top-2.5 left-4 bg-accent text-white text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={11} /> 2 mois offerts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[28px] font-semibold tracking-tight">24&nbsp;€</span>
              <span className="text-sub text-sm">/mois</span>
              <span className="text-faint text-xs line-through ml-auto">29&nbsp;€/mois</span>
            </div>
            <div className="text-sub text-xs mt-0.5 mb-3.5">Facturé 288&nbsp;€/an</div>
            <button
              onClick={() => subscribe("annual")}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-xl py-3 font-semibold text-[15px] disabled:opacity-60"
            >
              <CreditCard size={16} /> {loadingAction === "annual" ? "…" : "S'abonner — facturation annuelle"}
            </button>
          </div>

          <button
            onClick={() => subscribe("monthly")}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3.5 text-left disabled:opacity-60"
          >
            <span>
              <span className="text-[15px] font-medium">Mensuel, sans engagement</span>
              <span className="block text-faint text-xs mt-0.5">Résilie à tout moment</span>
            </span>
            <span className="font-display text-[15.5px] shrink-0">
              {loadingAction === "monthly" ? "…" : "29 €/mois"}
            </span>
          </button>
        </div>
      )}

      {hasStripeCustomer && (
        <button
          onClick={openPortal}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3.5 text-[15px] font-medium text-ink disabled:opacity-60"
        >
          {loadingAction === "portal" ? "…" : "Gérer mon abonnement"}
        </button>
      )}
    </div>
  );
}
