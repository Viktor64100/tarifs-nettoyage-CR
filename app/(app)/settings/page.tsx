import Link from "next/link";
import { BarChart3, ChevronRight, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company, daily_goal")
    .single();

  return (
    <div className="px-5 pt-7">
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-4">Réglages</h1>

      <div className="flex flex-col gap-2.5 mb-4">
        <Link
          href="/stats"
          className="flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5 text-[15px] font-medium">
            <BarChart3 size={17} className="text-accent" /> Statistiques
          </span>
          <ChevronRight size={17} className="text-faint" />
        </Link>

        <Link
          href="/billing"
          className="flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5 text-[15px] font-medium">
            <CreditCard size={17} className="text-accent" /> Facturation
          </span>
          <ChevronRight size={17} className="text-faint" />
        </Link>
      </div>

      <SettingsForm
        initialCompany={profile?.company ?? ""}
        initialGoal={profile?.daily_goal ?? 30}
      />
    </div>
  );
}
