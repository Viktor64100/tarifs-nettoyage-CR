"use client";
import { useState, useTransition } from "react";
import type { ProspectFormData } from "@/app/(app)/prospects/actions";
import { formatPhoneFR } from "@/lib/format";
import Field from "@/components/ui/Field";

const inputClass = "w-full border border-line rounded-xl px-3.5 py-3 bg-card text-base";

export default function ProspectForm({
  initial,
  showConsent = true,
  submitLabel = "Enregistrer",
  autoFocus = false,
  onSubmit,
}: {
  initial?: Partial<ProspectFormData>;
  showConsent?: boolean;
  submitLabel?: string;
  autoFocus?: boolean;
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
    consent_source: initial?.consent_source ?? "",
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
        <Field label="Prénom *" className="flex-1">
          <input
            value={f.first_name}
            onChange={set("first_name")}
            className={inputClass}
            autoFocus={autoFocus}
            autoComplete="given-name"
            aria-required="true"
          />
        </Field>
        <Field label="Nom" className="flex-1">
          <input value={f.last_name} onChange={set("last_name")} className={inputClass} autoComplete="family-name" />
        </Field>
      </div>
      <Field label="Entreprise">
        <input value={f.company} onChange={set("company")} className={inputClass} autoComplete="organization" />
      </Field>
      <Field label="Téléphone *">
        <input
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: formatPhoneFR(e.target.value) })}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-required="true"
          className={inputClass}
        />
      </Field>
      <Field label="Email (optionnel)">
        <input
          value={f.email}
          onChange={set("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          className={inputClass}
        />
      </Field>
      <Field label="Secteur (optionnel)">
        <input value={f.sector} onChange={set("sector")} className={inputClass} />
      </Field>
      {showConsent && (
        <div className="mb-2.5">
          <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={f.consent_given}
              onChange={(e) => setF({ ...f, consent_given: e.target.checked })}
              className="w-[18px] h-[18px] accent-accent"
            />
            <span className="text-sm text-sub">Consentement au démarchage recueilli</span>
          </label>
          <p className="text-xs text-faint -mt-0.5 mb-1 pl-[30px]">
            Obligatoire pour démarcher un particulier (loi opt-in du 11/08/2026). Laisse décoché si tu n&apos;as pas encore la preuve.
          </p>
          {f.consent_given && (
            <Field label="Source du consentement" className="mt-1.5">
              <input
                value={f.consent_source}
                onChange={set("consent_source")}
                placeholder="Ex. Formulaire salon, devis site web…"
                className={inputClass}
              />
            </Field>
          )}
        </div>
      )}
      {error && <p className="text-red text-sm mt-1.5">{error}</p>}
      <button
        disabled={!valid || pending}
        onClick={submit}
        className="w-full mt-1.5 bg-accent text-white rounded-xl py-3.5 font-semibold disabled:opacity-40"
      >
        {pending ? "…" : submitLabel}
      </button>
    </div>
  );
}
