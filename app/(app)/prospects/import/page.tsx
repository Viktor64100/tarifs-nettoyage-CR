"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Upload } from "lucide-react";
import { parseCSV, mapRowsToProspects } from "@/lib/csv";
import { importProspects } from "@/app/(app)/prospects/actions";

export default function ImportProspectsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { imported, skippedCount, usedHeader } = useMemo(() => mapRowsToProspects(parseCSV(raw)), [raw]);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function handleImport() {
    if (!imported.length) return;
    setError(null);
    startTransition(async () => {
      try {
        await importProspects(imported);
        router.push("/prospects");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="px-5 pt-5 pb-10">
      <button onClick={() => router.push("/prospects")} className="flex items-center gap-1 text-sub text-[15px] mb-3 -ml-1 px-1">
        <ChevronLeft size={18} /> Prospects
      </button>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-1.5">Importer des prospects</h1>
      <p className="text-sub text-sm mb-4">
        Colle des données depuis un tableur (Excel, Google Sheets…) ou choisis un fichier CSV. Colonnes reconnues :
        prénom, nom, entreprise, téléphone, email, secteur.
      </p>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-xl py-3 text-[15px] font-medium mb-3"
      >
        <Upload size={16} /> Choisir un fichier CSV
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder={"Colle ici, ex. :\nÉlodie;Marchand;Villa Azur;06 12 34 56 78;e@villazur.fr;Conciergerie"}
        className="w-full border border-line rounded-xl px-3.5 py-3 bg-card text-base font-mono resize-none mb-4"
      />

      {raw.trim() && (
        <div className="bg-card border border-line rounded-2xl p-4 mb-4">
          <div className="text-sm mb-2">
            <span className="font-semibold text-accent">{imported.length}</span> prospect{imported.length > 1 ? "s" : ""} prêt
            {imported.length > 1 ? "s" : ""} à importer
            {skippedCount > 0 && (
              <span className="text-sub"> · {skippedCount} ligne{skippedCount > 1 ? "s" : ""} ignorée{skippedCount > 1 ? "s" : ""} (prénom/téléphone manquant)</span>
            )}
          </div>
          <div className="text-xs text-faint mb-3">
            {usedHeader ? "En-têtes détectés." : "Pas d'en-tête détecté : ordre supposé prénom, nom, entreprise, téléphone, email, secteur."}
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {imported.slice(0, 8).map((p, i) => (
              <div key={i} className="text-sm text-ink">
                {p.first_name} {p.last_name ?? ""} <span className="text-faint">— {p.phone}</span>
              </div>
            ))}
            {imported.length > 8 && <div className="text-xs text-faint">… et {imported.length - 8} autres</div>}
          </div>
        </div>
      )}

      {error && <p className="text-red text-sm mb-3">{error}</p>}

      <button
        onClick={handleImport}
        disabled={!imported.length || pending}
        className="w-full bg-accent text-white rounded-xl py-3.5 font-semibold disabled:opacity-40"
      >
        {pending ? "…" : `Importer${imported.length ? ` (${imported.length})` : ""}`}
      </button>
    </div>
  );
}
