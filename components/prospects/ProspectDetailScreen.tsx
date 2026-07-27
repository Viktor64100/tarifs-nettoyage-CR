"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Phone, ShieldCheck, ShieldAlert, Trash2, Pencil } from "lucide-react";
import type { Interaction, Prospect } from "@/types/db";
import { StatusChip } from "./StatusChip";
import ProspectForm from "./ProspectForm";
import InteractionsTimeline from "./InteractionsTimeline";
import { updateProspect, deleteProspect, toggleConsent, type ProspectFormData } from "@/app/(app)/prospects/actions";

function fmtShort(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}

export default function ProspectDetailScreen({
  prospect,
  interactions,
}: {
  prospect: Prospect;
  interactions: Interaction[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleUpdate(data: ProspectFormData) {
    await updateProspect(prospect.id, data);
    router.refresh();
    setEditing(false);
  }

  function handleConsentToggle() {
    setError(null);
    startTransition(async () => {
      try {
        await toggleConsent(prospect.id, prospect.consent_given);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer ce prospect ?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteProspect(prospect.id);
      } catch (e) {
        // `deleteProspect` redirige en cas de succès : Next.js signale ça via une
        // exception spéciale qu'il ne faut surtout pas avaler, sinon la navigation casse.
        if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError(e instanceof Error ? e.message : "Suppression impossible.");
      }
    });
  }

  const tel = "tel:" + prospect.phone.replace(/\s/g, "");

  if (editing) {
    return (
      <div className="px-5 pt-5 pb-8">
        <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sub text-[15px] mb-3 -ml-1 px-1">
          <ChevronLeft size={18} /> Annuler
        </button>
        <h1 className="font-display text-2xl font-semibold mb-4">Modifier le prospect</h1>
        <ProspectForm
          initial={{
            first_name: prospect.first_name,
            last_name: prospect.last_name ?? "",
            company: prospect.company ?? "",
            phone: prospect.phone,
            email: prospect.email ?? "",
            sector: prospect.sector ?? "",
            consent_given: prospect.consent_given,
          }}
          showConsent={false}
          submitLabel="Enregistrer les modifications"
          onSubmit={handleUpdate}
        />
      </div>
    );
  }

  return (
    <div className="px-5 pt-5 pb-8">
      <button onClick={() => router.push("/prospects")} className="flex items-center gap-1 text-sub text-[15px] mb-2 -ml-1 px-1">
        <ChevronLeft size={18} /> Prospects
      </button>

      <div className="flex justify-between items-start mb-1">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight">
            {prospect.first_name} {prospect.last_name}
          </h1>
          <div className="text-sub text-[15.5px] mt-0.5">
            {prospect.company}
            {prospect.sector ? ` · ${prospect.sector}` : ""}
          </div>
        </div>
        <StatusChip status={prospect.status} />
      </div>

      <a
        href={tel}
        className="flex items-center justify-center gap-2 bg-accent text-white rounded-2xl py-3.5 font-semibold text-[16px] my-4"
      >
        <Phone size={18} /> {prospect.phone}
      </a>

      <button
        onClick={handleConsentToggle}
        disabled={pending}
        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-4 text-left"
        style={{
          background: prospect.consent_given ? "var(--color-accent-soft)" : "#FAEFDA",
          border: `1px solid ${prospect.consent_given ? "#CBE6D8" : "#EEDFBF"}`,
        }}
      >
        {prospect.consent_given ? (
          <ShieldCheck size={22} className="text-accent shrink-0" />
        ) : (
          <ShieldAlert size={22} className="text-amber shrink-0" />
        )}
        <div className="flex-1">
          <div className={`text-sm font-semibold ${prospect.consent_given ? "text-accent-dk" : "text-amber"}`}>
            {prospect.consent_given ? "Consentement recueilli" : "Consentement non recueilli"}
          </div>
          <div className="text-xs text-sub mt-0.5">
            {prospect.consent_given
              ? `${fmtShort(prospect.consent_at)} · ${prospect.consent_source || "source non précisée"}`
              : "Requis pour démarcher un particulier (loi opt-in, 11 août 2026)"}
          </div>
        </div>
        <span className="text-xs text-faint">modifier</span>
      </button>

      <button
        onClick={() => setEditing(true)}
        className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3 text-[15px] font-medium mb-2.5"
      >
        <Pencil size={15} /> Modifier
      </button>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 text-red text-sm py-2.5 mb-2 disabled:opacity-60"
      >
        <Trash2 size={15} /> Supprimer
      </button>
      {error && <p className="text-red text-sm text-center mb-2">{error}</p>}

      <div className="text-xs tracking-wide uppercase text-faint font-semibold mt-4 mb-2.5 px-0.5">Historique</div>
      <InteractionsTimeline interactions={interactions} />
    </div>
  );
}
