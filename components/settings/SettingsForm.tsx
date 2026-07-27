"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, exportProspectsCSV } from "@/app/(app)/settings/actions";

export default function SettingsForm({
  initialCompany,
  initialGoal,
}: {
  initialCompany: string;
  initialGoal: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [company, setCompany] = useState(initialCompany);
  const [goal, setGoal] = useState(initialGoal);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile({ company, daily_goal: Math.max(1, goal || 1) });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  async function exportCSV() {
    setError(null);
    setExporting(true);
    try {
      const csv = await exportProspectsCSV();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "nextcall-prospects.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export impossible.");
    } finally {
      setExporting(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <div className="bg-card border border-line rounded-2xl p-4 mb-4">
        <label className="block mb-3.5">
          <div className="text-sm text-sub mb-1.5 font-medium">Entreprise</div>
          <input
            className="w-full border border-line rounded-xl px-3.5 py-3 bg-card text-[15.5px]"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
        <label className="block">
          <div className="text-sm text-sub mb-1.5 font-medium">Objectif d'appels par jour</div>
          <input
            type="number"
            min={1}
            className="w-full border border-line rounded-xl px-3.5 py-3 bg-card text-[15.5px]"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </label>
        {error && <p className="text-red text-sm mt-2.5">{error}</p>}
        <button
          onClick={save}
          disabled={pending}
          className="w-full mt-3.5 bg-accent text-white rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {pending ? "…" : saved ? "Enregistré" : "Enregistrer"}
        </button>
      </div>

      <button
        onClick={exportCSV}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3.5 text-[15px] font-medium text-ink mb-2.5 disabled:opacity-60"
      >
        <Download size={17} /> {exporting ? "Export…" : "Exporter les prospects (CSV)"}
      </button>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3.5 text-[15px] font-medium text-ink"
      >
        <LogOut size={17} /> Se déconnecter
      </button>
    </div>
  );
}
