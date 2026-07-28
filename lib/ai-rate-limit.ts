import type { SupabaseClient } from "@supabase/supabase-js";

// Plafond technique par utilisateur/jour sur les endpoints IA (résumé, transcription
// vocale). Très au-dessus d'un usage réel (~1 appel toutes les 4 min sur 12h) :
// sert uniquement à contenir une boucle/bug/abus, pas à limiter un plan commercial.
const DAILY_LIMIT = 300;

// Best-effort, pas parfaitement atomique sous concurrence — acceptable pour un
// filet de sécurité, pas une garantie stricte de facturation.
export async function checkAndBumpAiUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("ai_usage_daily")
    .select("count")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();

  if (existing && existing.count >= DAILY_LIMIT) return { allowed: false };

  await supabase
    .from("ai_usage_daily")
    .upsert(
      { user_id: userId, day: today, count: (existing?.count ?? 0) + 1 },
      { onConflict: "user_id,day" }
    );

  return { allowed: true };
}
