"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProspectFormData = {
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  email: string;
  sector: string;
  consent_given: boolean;
  consent_source: string;
};

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");
  return { supabase, user };
}

export async function createProspect(data: ProspectFormData) {
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  const { error } = await supabase.from("prospects").insert({
    user_id: user.id,
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim() || null,
    company: data.company.trim() || null,
    phone: data.phone.trim(),
    email: data.email.trim() || null,
    sector: data.sector.trim() || null,
    consent_given: data.consent_given,
    consent_at: data.consent_given ? now : null,
    consent_source: data.consent_given ? data.consent_source.trim() || "Saisie manuelle" : null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/prospects");
  revalidatePath("/dashboard");
}

export async function updateProspect(id: string, data: ProspectFormData) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("prospects")
    .update({
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim() || null,
      company: data.company.trim() || null,
      phone: data.phone.trim(),
      email: data.email.trim() || null,
      sector: data.sector.trim() || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/prospects");
  revalidatePath(`/prospects/${id}`);
}

export async function deleteProspect(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/prospects");
  revalidatePath("/dashboard");
}

// Suppression globale (Réglages → zone dangereuse). Irréversible : les interactions
// liées sont purgées en cascade (FK on delete cascade), les prospects ne le sont pas.
export async function deleteAllProspects() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("prospects").delete().eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function toggleConsent(id: string, currentlyGiven: boolean, source?: string) {
  const { supabase } = await requireUser();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("prospects")
    .update(
      currentlyGiven
        ? { consent_given: false, consent_at: null, consent_source: null }
        : { consent_given: true, consent_at: now, consent_source: source?.trim() || "Saisie manuelle" }
    )
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/prospects");
  revalidatePath(`/prospects/${id}`);
}

export type ImportRow = {
  first_name: string;
  last_name?: string;
  company?: string;
  phone: string;
  email?: string;
  sector?: string;
};

export async function importProspects(rows: ImportRow[]) {
  const { supabase, user } = await requireUser();
  if (!rows.length) return { inserted: 0 };

  const { error } = await supabase.from("prospects").insert(
    rows.map((r) => ({
      user_id: user.id,
      first_name: r.first_name.trim(),
      last_name: r.last_name?.trim() || null,
      company: r.company?.trim() || null,
      phone: r.phone.trim(),
      email: r.email?.trim() || null,
      sector: r.sector?.trim() || null,
      consent_given: false,
    }))
  );
  if (error) throw new Error(error.message);

  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  return { inserted: rows.length };
}
