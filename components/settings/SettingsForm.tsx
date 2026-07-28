"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Download, ShieldQuestion, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, exportProspectsCSV, deleteAccount } from "@/app/(app)/settings/actions";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
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
  const confirm = useConfirm();
  const [company, setCompany] = useState(initialCompany);
  const [goal, setGoal] = useState(initialGoal);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: "Supprimer définitivement ton compte ?",
      message:
        "Ton compte, tes prospects, ton historique d'appels et ton abonnement seront supprimés sans possibilité de récupération.",
      confirmLabel: "Supprimer mon compte",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Suppression impossible.", "error");
      setDeleting(false);
    }
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
        className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3.5 text-[15px] font-medium text-ink mb-2.5"
      >
        <LogOut size={17} /> Se déconnecter
      </button>

      <Link
        href="/privacy"
        className="w-full flex items-center justify-center gap-2 bg-card border border-line rounded-2xl py-3.5 text-[15px] font-medium text-ink"
      >
        <ShieldQuestion size={17} /> Confidentialité et données personnelles
      </Link>

      <div className="mt-8 pt-5 border-t border-line">
        <div className="text-xs tracking-wide uppercase text-faint font-semibold mb-2.5 px-0.5">
          Zone dangereuse
        </div>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full flex items-center justify-center gap-2 bg-red-soft border border-line rounded-2xl py-3.5 text-[15px] font-medium text-red disabled:opacity-60"
        >
          <Trash2 size={17} /> {deleting ? "Suppression…" : "Supprimer mon compte"}
        </button>
      </div>
    </div>
  );
}
