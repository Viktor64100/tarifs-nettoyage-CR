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
      <SettingsForm
        initialCompany={profile?.company ?? ""}
        initialGoal={profile?.daily_goal ?? 30}
      />
      <p className="text-faint text-xs text-center mt-6 leading-relaxed">
        Export CSV, statistiques et facturation arrivent bientôt.
      </p>
    </div>
  );
}
