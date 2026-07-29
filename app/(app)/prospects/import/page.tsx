import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneKey } from "@/lib/format";
import ImportScreen from "@/components/prospects/ImportScreen";

export const metadata: Metadata = { title: "Importer" };

export default async function ImportProspectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("prospects").select("phone");
  const existingPhoneKeys = [...new Set((data ?? []).map((p) => normalizePhoneKey(p.phone)).filter(Boolean))];

  return <ImportScreen existingPhoneKeys={existingPhoneKeys} />;
}
