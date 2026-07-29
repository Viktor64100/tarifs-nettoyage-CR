"use client";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy, MessageSquareText, Phone, ShieldCheck, ShieldAlert, Sparkles, Trash2, Pencil } from "lucide-react";
import type { Interaction, Prospect } from "@/types/db";
import { StatusChip } from "./StatusChip";
import ProspectForm from "./ProspectForm";
import InteractionsTimeline from "./InteractionsTimeline";
import { updateProspect, deleteProspect, toggleConsent, type ProspectFormData } from "@/app/(app)/prospects/actions";
import { fmtTimestampShort } from "@/lib/format";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import Field from "@/components/ui/Field";

export default function ProspectDetailScreen({
  prospect,
  interactions,
}: {
  prospect: Prospect;
  interactions: Interaction[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [addingConsent, setAddingConsent] = useState(false);
  const [consentSource, setConsentSource] = useState("");
  const [pending, startTransition] = useTransition();
  const [optimisticProspect, setOptimisticProspect] = useOptimistic(prospect);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpText, setFollowUpText] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  async function generateFollowUp() {
    setFollowUpOpen(true);
    setFollowUpLoading(true);
    setFollowUpError(null);
    try {
      const res = await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Message indisponible pour le moment.");
      }
      const data = (await res.json()) as { message: string };
      setFollowUpText(data.message);
    } catch (e) {
      setFollowUpError(e instanceof Error ? e.message : "Message indisponible pour le moment.");
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function copyFollowUp() {
    if (!followUpText) return;
    try {
      await navigator.clipboard.writeText(followUpText);
      toast("Message copié.");
    } catch {
      toast("Copie impossible sur cet appareil.", "error");
    }
  }

  async function handleUpdate(data: ProspectFormData) {
    await updateProspect(prospect.id, data);
    toast("Prospect mis à jour.");
    router.refresh();
    setEditing(false);
  }

  function confirmConsentOn() {
    const source = consentSource.trim() || "Saisie manuelle";
    setAddingConsent(false);
    startTransition(async () => {
      setOptimisticProspect({
        ...prospect,
        consent_given: true,
        consent_at: new Date().toISOString(),
        consent_source: source,
      });
      try {
        await toggleConsent(prospect.id, false, source);
        toast("Consentement enregistré.");
        router.refresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Une erreur est survenue.", "error");
      }
    });
  }

  function revokeConsent() {
    startTransition(async () => {
      setOptimisticProspect({ ...prospect, consent_given: false, consent_at: null, consent_source: null });
      try {
        await toggleConsent(prospect.id, true);
        toast("Consentement retiré.");
        router.refresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Une erreur est survenue.", "error");
      }
    });
  }

  function handleConsentClick() {
    if (optimisticProspect.consent_given) {
      revokeConsent();
    } else {
      setConsentSource("");
      setAddingConsent(true);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Supprimer ce prospect ?",
      message: `${prospect.first_name} ${prospect.last_name ?? ""} et tout son historique seront définitivement supprimés.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteProspect(prospect.id);
        toast("Prospect supprimé.");
        router.push("/prospects");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Suppression impossible.", "error");
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
        onClick={handleConsentClick}
        disabled={pending}
        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-1.5 text-left"
        style={{
          background: optimisticProspect.consent_given ? "var(--color-accent-soft)" : "var(--color-amber-soft)",
          border: `1px solid ${optimisticProspect.consent_given ? "var(--color-accent-border)" : "var(--color-amber-border)"}`,
        }}
      >
        {optimisticProspect.consent_given ? (
          <ShieldCheck size={22} className="text-accent shrink-0" />
        ) : (
          <ShieldAlert size={22} className="text-amber shrink-0" />
        )}
        <div className="flex-1">
          <div className={`text-sm font-semibold ${optimisticProspect.consent_given ? "text-accent-dk" : "text-amber"}`}>
            {optimisticProspect.consent_given ? "Consentement recueilli" : "Consentement non recueilli"}
          </div>
          <div className="text-xs text-sub mt-0.5">
            {optimisticProspect.consent_given
              ? `${fmtTimestampShort(optimisticProspect.consent_at)} · ${optimisticProspect.consent_source || "source non précisée"}`
              : "Requis pour démarcher un particulier (loi opt-in, 11 août 2026)"}
          </div>
        </div>
        <span className="text-xs text-faint">{optimisticProspect.consent_given ? "retirer" : "recueillir"}</span>
      </button>

      {addingConsent && (
        <div className="bg-card border border-line rounded-2xl p-4 mb-4">
          <Field label="Source du consentement">
            <input
              autoFocus
              value={consentSource}
              onChange={(e) => setConsentSource(e.target.value)}
              placeholder="Ex. Formulaire salon, devis site web…"
              className="w-full border border-line rounded-xl px-3.5 py-3 bg-card text-base"
            />
          </Field>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setAddingConsent(false)}
              className="flex-1 bg-card border border-line rounded-xl py-2.5 text-sm font-medium"
            >
              Annuler
            </button>
            <button onClick={confirmConsentOn} className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-semibold">
              Confirmer
            </button>
          </div>
        </div>
      )}

      {followUpOpen ? (
        <div className="bg-card border border-line rounded-2xl p-4 mb-2.5">
          <div className="flex items-center gap-1.5 text-accent-dk text-xs font-semibold mb-2">
            <Sparkles size={13} /> Message de relance
          </div>
          {followUpLoading && <p className="text-sub text-sm">Rédaction en cours…</p>}
          {followUpError && (
            <div>
              <p className="text-red text-sm">{followUpError}</p>
              <button onClick={generateFollowUp} className="text-accent-dk text-xs font-semibold mt-1.5">
                Réessayer
              </button>
            </div>
          )}
          {followUpText && !followUpLoading && (
            <>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{followUpText}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={copyFollowUp}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white rounded-xl py-2.5 text-sm font-semibold"
                >
                  <Copy size={14} /> Copier
                </button>
                <button
                  onClick={generateFollowUp}
                  className="flex-1 bg-card border border-line rounded-xl py-2.5 text-sm font-medium text-ink"
                >
                  Régénérer
                </button>
              </div>
            </>
          )}
          <button onClick={() => setFollowUpOpen(false)} className="text-faint text-xs mt-3">
            Fermer
          </button>
        </div>
      ) : (
        <button
          onClick={generateFollowUp}
          className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3 text-[15px] font-medium mb-2.5"
        >
          <MessageSquareText size={15} /> Message de relance
        </button>
      )}

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

      <div className="text-xs tracking-wide uppercase text-faint font-semibold mt-4 mb-2.5 px-0.5">Historique</div>
      <InteractionsTimeline interactions={interactions} />
    </div>
  );
}
