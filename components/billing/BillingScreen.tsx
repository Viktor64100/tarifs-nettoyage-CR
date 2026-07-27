"use client";
import { useState } from "react";
import { ShieldAlert, ShieldCheck, CreditCard } from "lucide-react";
import type { PlanStatus } from "@/types/db";

const PLAN_LABEL: Record<PlanStatus, string> = {
  trial: "Essai",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Annulé",
};

export default function BillingScreen({
  plan,
  trialEndsAt,
  hasStripeCustomer,
}: {
  plan: PlanStatus;
  trialEndsAt: string | null;
  hasStripeCustomer: boolean;
}) {
  const [loadingAction, setLoadingAction] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const daysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;
  const trialExpired = plan !== "active" && daysLeft !== null && daysLeft < 0;

  async function goTo(action: "checkout" | "portal") {
    setError(null);
    setLoadingAction(action);
    try {
      const res = await fetch(`/api/stripe/${action}`, { method: "POST" });
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
            "Ton abonnement NextCall (15 €/mois) est actif. Gère-le, change de moyen de paiement ou résilie depuis le portail Stripe."}
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

      {plan !== "active" && (
        <button
          onClick={() => goTo("checkout")}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-2xl py-3.5 font-semibold text-[15.5px] disabled:opacity-60 mb-2.5"
        >
          <CreditCard size={17} /> {loadingAction === "checkout" ? "…" : "S'abonner — 15 €/mois"}
        </button>
      )}

      {hasStripeCustomer && (
        <button
          onClick={() => goTo("portal")}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3.5 text-[15px] font-medium text-ink disabled:opacity-60"
        >
          {loadingAction === "portal" ? "…" : "Gérer mon abonnement"}
        </button>
      )}
    </div>
  );
}
