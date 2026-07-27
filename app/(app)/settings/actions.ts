"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

function csvCell(v: string | number | boolean | null): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
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
