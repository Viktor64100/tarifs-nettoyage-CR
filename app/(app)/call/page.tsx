import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types/db";
import CallFlowScreen from "@/components/call/CallFlowScreen";

export default async function CallPage() {
  const supabase = await createClient();
  const { data: queue } = await supabase.from("call_queue").select("*").limit(50);
  const list = (queue ?? []) as Prospect[];

  if (!list.length) redirect("/dashboard");

  return <CallFlowScreen queue={list} />;
}
