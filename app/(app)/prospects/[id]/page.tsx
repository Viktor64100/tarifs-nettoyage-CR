import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types/db";
import ProspectDetailScreen from "@/components/prospects/ProspectDetailScreen";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("prospects").select("*").eq("id", id).single();
  if (!data) notFound();

  return <ProspectDetailScreen prospect={data as Prospect} />;
}
