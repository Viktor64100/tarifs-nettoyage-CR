"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InteractionType, ProspectStatus } from "@/types/db";
import { OUTCOMES, addDaysISO, todayISO } from "@/lib/call-outcomes";

export async function logCallOutcome(
  prospectId: string,
  outcomeKey: InteractionType,
  opts: { note?: string; followUpAt?: string | null } = {}
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const outcome = OUTCOMES.find((o) => o.key === outcomeKey);
  if (!outcome) throw new Error("Résultat d'appel invalide.");

  const { error: interactionError } = await supabase.from("interactions").insert({
    prospect_id: prospectId,
    user_id: user.id,
    type: outcomeKey,
    note: opts.note?.trim() || null,
  });
  if (interactionError) throw new Error(interactionError.message);

  let nextFollowUpAt: string | null;
  switch (outcome.kind) {
    case "requeue":
      nextFollowUpAt = addDaysISO(todayISO(), 2);
      break;
    case "schedule":
      nextFollowUpAt = opts.followUpAt ?? addDaysISO(todayISO(), outcome.defaultDelayDays ?? 1);
      break;
    default:
      nextFollowUpAt = null;
  }

  const { error: prospectError } = await supabase
    .from("prospects")
    .update({ status: outcomeKey as ProspectStatus, next_follow_up_at: nextFollowUpAt })
    .eq("id", prospectId);
  if (prospectError) throw new Error(prospectError.message);

  revalidatePath("/dashboard");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospectId}`);
}
