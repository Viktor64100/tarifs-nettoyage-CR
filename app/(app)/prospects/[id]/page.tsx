import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Interaction, Prospect } from "@/types/db";
import ProspectDetailScreen from "@/components/prospects/ProspectDetailScreen";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: prospect }, { data: interactions }] = await Promise.all([
    supabase.from("prospects").select("*").eq("id", id).single(),
    supabase.from("interactions").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
  ]);
  if (!prospect) notFound();

  return <ProspectDetailScreen prospect={prospect as Prospect} interactions={(interactions ?? []) as Interaction[]} />;
}
