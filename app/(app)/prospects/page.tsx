import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types/db";
import ProspectsScreen from "@/components/prospects/ProspectsScreen";

export const metadata: Metadata = { title: "Prospects" };

export default async function ProspectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
  const list = (data ?? []) as Prospect[];

  return <ProspectsScreen prospects={list} />;
}
