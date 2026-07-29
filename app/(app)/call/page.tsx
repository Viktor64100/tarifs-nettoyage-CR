import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types/db";
import CallFlowScreen from "@/components/call/CallFlowScreen";
import { sortByPriority } from "@/lib/queue-priority";
import { todayISO } from "@/lib/format";

export const metadata: Metadata = { title: "Appel en cours" };

export default async function CallPage({
  searchParams,
}: {
  searchParams: Promise<{ sprint?: string }>;
}) {
  const supabase = await createClient();
  const { data: queue } = await supabase.from("call_queue").select("*").limit(50);
  const list = sortByPriority((queue ?? []) as Prospect[], todayISO());

  if (!list.length) redirect("/dashboard");

  const { sprint } = await searchParams;
  const sprintMinutes = sprint ? Number(sprint) : null;

  return <CallFlowScreen queue={list} sprintMinutes={sprintMinutes && sprintMinutes > 0 ? sprintMinutes : null} />;
}
