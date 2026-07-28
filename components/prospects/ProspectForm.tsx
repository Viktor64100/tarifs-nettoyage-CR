"use client";
import { useState, useTransition } from "react";
import type { ProspectFormData } from "@/app/(app)/prospects/actions";

// text-base (16px) : en dessous, Safari iOS zoome automatiquement le champ au focus.
const inputClass = "w-full border border-line rounded-xl px-3.5 py-3 bg-card text-base mb-2.5";

export default function ProspectForm({
  initial,
  showConsent = true,
  submitLabel = "Enregistrer",
  onSubmit,
}: {
  initial?: Partial<ProspectFormData>;
  showConsent?: boolean;
  submitLabel?: string;
  onSubmit: (data: ProspectFormData) => Promise<void>;
}) {
  const [f, setF] = useState<ProspectFormData>({
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    company: initial?.company ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    sector: initial?.sector ?? "",
    consent_given: initial?.consent_given ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valid = f.first_name.trim() && f.phone.trim();
  const set = (k: keyof ProspectFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  function submit() {
    if (!valid) return;
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(f);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div>
      <div className="flex gap-2.5">
        <input placeholder="Prénom *" value={f.first_name} onChange={set("first_name")} className={inputClass} />
        <input placeholder="Nom" value={f.last_name} onChange={set("last_name")} className={inputClass} />
      </div>
      <input placeholder="Entreprise" value={f.company} onChange={set("company")} className={inputClass} />
      <input placeholder="Téléphone *" value={f.phone} onChange={set("phone")} inputMode="tel" className={inputClass} />
      <input placeholder="Email (optionnel)" value={f.email} onChange={set("email")} inputMode="email" className={inputClass} />
      <input placeholder="Secteur (optionnel)" value={f.sector} onChange={set("sector")} className={inputClass} />
      {showConsent && (
        <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={f.consent_given}
            onChange={(e) => setF({ ...f, consent_given: e.target.checked })}
            className="w-[18px] h-[18px] accent-accent"
          />
          <span className="text-sm text-sub">Consentement au démarchage recueilli</span>
        </label>
      )}
      {error && <p className="text-red text-sm mt-1.5">{error}</p>}
      <button
        disabled={!valid || pending}
        onClick={submit}
        className="w-full mt-3.5 bg-accent text-white rounded-xl py-3.5 font-semibold disabled:opacity-40"
      >
        {pending ? "…" : submitLabel}
      </button>
    </div>
  );
}
