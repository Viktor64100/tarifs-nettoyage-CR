"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type { Prospect } from "@/types/db";

export async function updateProfile(data: { company: string; daily_goal: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { error } = await supabase
    .from("profiles")
    .update({ company: data.company || null, daily_goal: data.daily_goal })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

// Neutralise l'injection de formule CSV : si un champ (nom, entreprise…)
// commence par =, +, -, @ ou une tabulation, Excel/Sheets peut l'interpréter
// comme une formule à l'ouverture. On préfixe d'une apostrophe pour forcer
// une lecture en texte brut (mitigation standard OWASP).
function csvCell(v: string | number | boolean | null): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function exportProspectsCSV(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Prospect[];

  const head = [
    "prenom", "nom", "entreprise", "telephone", "email", "secteur",
    "statut", "prochaine_relance", "consentement", "date_consentement",
  ];
  const lines = rows.map((p) =>
    [
      p.first_name, p.last_name, p.company, p.phone, p.email, p.sector,
      p.status, p.next_follow_up_at, p.consent_given ? "oui" : "non", p.consent_at,
    ]
      .map(csvCell)
      .join(",")
  );

  return [head.join(","), ...lines].join("\n");
}

// Droit à l'effacement (RGPD) en libre-service. Résilie l'abonnement Stripe actif
// (best-effort — on ne bloque pas la suppression si Stripe échoue), puis supprime
// le compte auth.users : la suppression en cascade (FK on delete cascade) purge
// profiles, prospects, interactions et ai_usage_daily.
export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch {
      // Abonnement déjà résilié/inexistant côté Stripe : on continue la suppression.
    }
  }

  const { error } = await getAdminClient().auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);
}
