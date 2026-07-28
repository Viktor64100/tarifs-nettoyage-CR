"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, exportProspectsCSV } from "@/app/(app)/settings/actions";
import { useToast } from "@/components/ui/ToastProvider";
import Field from "@/components/ui/Field";

export default function SettingsForm({
  initialCompany,
  initialGoal,
}: {
  initialCompany: string;
  initialGoal: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [company, setCompany] = useState(initialCompany);
  const [goal, setGoal] = useState(initialGoal);
  const [exporting, setExporting] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateProfile({ company, daily_goal: Math.max(1, goal || 1) });
        toast("Réglages enregistrés.");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Une erreur est survenue.", "error");
      }
    });
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const csv = await exportProspectsCSV();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "nextcall-prospects.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast("Export téléchargé.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Export impossible.", "error");
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
        <Field label="Entreprise">
          <input
            className="w-full border border-line rounded-xl px-3.5 py-3 bg-card text-base"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Field>
        <Field label="Objectif d'appels par jour" className="mb-0">
          <input
            type="number"
            min={1}
            className="w-full border border-line rounded-xl px-3.5 py-3 bg-card text-base"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </Field>
        <button
          onClick={save}
          disabled={pending}
          className="w-full mt-3.5 bg-accent text-white rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {pending ? "…" : "Enregistrer"}
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
