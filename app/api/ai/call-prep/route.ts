import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndBumpAiUsage } from "@/lib/ai-rate-limit";

// POST { prospectId: string } -> { opening: string, questions: string[] }
// Prépare l'appel AVANT qu'il ne démarre : une accroche courte + les questions clés à poser,
// à partir du contexte réel du prospect. N'entend jamais l'appel lui-même (hors de portée du
// navigateur) — sert uniquement à réduire le temps de "remise en contexte" avant de composer.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { allowed } = await checkAndBumpAiUsage(supabase, user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite d'utilisation IA quotidienne atteinte. Réessaie demain." },
      { status: 429 }
    );
  }

  const { prospectId } = await req.json();
  if (!prospectId) return NextResponse.json({ error: "prospectId manquant" }, { status: 400 });

  const [{ data: prospect }, { data: history }] = await Promise.all([
    supabase
      .from("prospects")
      .select("first_name, last_name, company, sector, status, consent_given")
      .eq("id", prospectId)
      .single(),
    supabase
      .from("interactions")
      .select("note, ai_summary, type, created_at")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  if (!prospect) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  const historyText = (history ?? [])
    .map((h) => `- [${h.type}] ${h.ai_summary || h.note || "(sans note)"}`)
    .join("\n");

  const context = [
    `Prénom : ${prospect.first_name}`,
    prospect.company ? `Entreprise : ${prospect.company}` : null,
    prospect.sector ? `Secteur : ${prospect.sector}` : null,
    `Statut actuel : ${prospect.status}`,
    prospect.status === "nouveau" ? "C'est le tout premier appel à ce prospect." : null,
    historyText ? `Historique des derniers échanges :\n${historyText}` : "Aucun échange précédent.",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Tu prépares un commercial francophone juste avant un appel de prospection téléphonique. " +
          "À partir du contexte fourni, propose une accroche d'ouverture courte (1-2 phrases, naturelle à l'oral, " +
          "pas un script robotique) et exactement deux questions clés à poser pendant l'appel pour qualifier ou " +
          "faire avancer le prospect. Si c'est un premier appel, l'accroche doit être une prise de contact ; si un " +
          "historique existe, elle doit rebondir dessus. Ne jamais inventer de détail absent du contexte. " +
          "Renvoie UNIQUEMENT un objet JSON : { \"opening\": string, \"questions\": string[2] }.",
      },
      { role: "user", content: context },
    ],
  });

  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    if (!parsed.opening) throw new Error("empty");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "réponse IA illisible" }, { status: 502 });
  }
}
