import type { SupabaseClient } from "@supabase/supabase-js";
import { openai } from "@/lib/openai";

// Coaching hebdomadaire : un insight généré au plus une fois par semaine ISO, mis en cache
// sur profiles.weekly_coaching. Règle d'or : l'IA ne fait JAMAIS de calcul — tous les chiffres
// sont vérifiés côté code avant de lui être fournis, elle se contente de les mettre en mots
// de façon naturelle et encourageante. Pas de nouvel appel réseau côté client : tout se passe
// pendant le rendu du dashboard (Server Component).

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // lundi = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNum =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    );
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

const MIN_CALLS_THIS_WEEK = 5;

// Seuls les résultats d'appel comptent comme "appels" — exclut les types réservés pour de
// futures notes libres (jamais insérés par le flux d'appel actuel, mais on reste correct
// si ça change un jour).
const CALL_OUTCOME_TYPES = new Set(["injoignable", "interesse", "a_rappeler", "pas_interesse", "rdv", "mauvais_numero"]);

type CachedCoaching = { week: string; insight: string } | null;

export async function getWeeklyCoaching(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const week = isoWeek(new Date());

  const { data: profile } = await supabase.from("profiles").select("weekly_coaching").eq("id", userId).single();
  const cached = (profile?.weekly_coaching ?? null) as CachedCoaching;
  if (cached?.week === week) return cached.insight;

  const now = Date.now();
  const weekStart = new Date(now - 7 * 86400000).toISOString();
  const twoWeeksStart = new Date(now - 14 * 86400000).toISOString();

  const { data: allInteractions } = await supabase
    .from("interactions")
    .select("type, created_at")
    .gte("created_at", twoWeeksStart);
  if (!allInteractions) return null;
  const interactions = allInteractions.filter((i) => CALL_OUTCOME_TYPES.has(i.type));

  const thisWeek = interactions.filter((i) => i.created_at >= weekStart);
  const lastWeek = interactions.filter((i) => i.created_at < weekStart);
  if (thisWeek.length < MIN_CALLS_THIS_WEEK) return null;

  const callsThisWeek = thisWeek.length;
  const callsLastWeek = lastWeek.length;
  const rdvThisWeek = thisWeek.filter((i) => i.type === "rdv").length;
  const rdvLastWeek = lastWeek.filter((i) => i.type === "rdv").length;
  const conversionThisWeek = callsThisWeek ? Math.round((rdvThisWeek / callsThisWeek) * 100) : 0;
  const conversionLastWeek = callsLastWeek ? Math.round((rdvLastWeek / callsLastWeek) * 100) : 0;

  const facts = [
    `Appels cette semaine : ${callsThisWeek} (semaine précédente : ${callsLastWeek})`,
    `Rendez-vous obtenus cette semaine : ${rdvThisWeek} (semaine précédente : ${rdvLastWeek})`,
    `Taux de transformation cette semaine : ${conversionThisWeek}% (semaine précédente : ${conversionLastWeek}%)`,
  ].join("\n");

  let insight: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu es un coach commercial bienveillant et direct, en français. On te donne des chiffres RÉELS et " +
            "VÉRIFIÉS de la semaine d'un commercial en prospection téléphonique. Rédige UNE SEULE phrase courte " +
            "(observation + encouragement ou conseil concret), naturelle et jamais robotique. " +
            "N'invente JAMAIS de chiffre absent des données fournies — utilise uniquement ceux donnés. " +
            "Si la semaine est meilleure que la précédente, félicite sans exagérer. Si elle est moins bonne, reste " +
            "factuel et constructif, jamais culpabilisant. " +
            "Renvoie UNIQUEMENT un objet JSON : { \"insight\": string }.",
        },
        { role: "user", content: facts },
      ],
    });
    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    if (!parsed.insight) return null;
    insight = parsed.insight;
  } catch {
    return null;
  }

  await supabase
    .from("profiles")
    .update({ weekly_coaching: { week, insight, generated_at: new Date().toISOString() } })
    .eq("id", userId);

  return insight;
}
