import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndBumpAiUsage } from "@/lib/ai-rate-limit";

// POST { prospectId: string } -> { message: string }
// Génère un message de relance court (SMS ou email) prêt à copier-coller. Ne l'envoie jamais
// lui-même : l'IA rédige, l'utilisateur valide et envoie depuis sa propre messagerie.
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

  const [{ data: prospect }, { data: lastInteraction }, { data: profile }] = await Promise.all([
    supabase
      .from("prospects")
      .select("first_name, last_name, company, sector, status")
      .eq("id", prospectId)
      .single(),
    supabase
      .from("interactions")
      .select("note, ai_summary, type")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name, company").eq("id", user.id).single(),
  ]);
  if (!prospect) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  const context = [
    `Prénom du prospect : ${prospect.first_name}`,
    prospect.company ? `Entreprise : ${prospect.company}` : null,
    prospect.sector ? `Secteur : ${prospect.sector}` : null,
    `Statut actuel : ${prospect.status}`,
    lastInteraction?.ai_summary ? `Résumé du dernier échange : ${lastInteraction.ai_summary}` : null,
    lastInteraction?.note ? `Dernière note : ${lastInteraction.note}` : null,
    profile?.full_name ? `Signature à utiliser : ${profile.full_name}` : null,
    profile?.company ? `Entreprise de l'expéditeur : ${profile.company}` : null,
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
          "Tu rédiges un message de relance court en français pour un commercial en prospection téléphonique. " +
          "Le message doit être chaleureux mais direct, tutoyer ou vouvoyer selon ce qui est le plus naturel pour du B2B " +
          "(vouvoiement par défaut), tenir en 2-3 phrases maximum (utilisable par SMS ou email), faire référence au " +
          "contexte fourni si pertinent, et se terminer par la signature donnée si elle existe. " +
          "Ne jamais inventer d'information absente du contexte (pas de date, pas de prix, pas de promesse non fournie). " +
          "Renvoie UNIQUEMENT un objet JSON : { \"message\": string }.",
      },
      { role: "user", content: context },
    ],
  });

  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    if (!parsed.message) throw new Error("empty");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "réponse IA illisible" }, { status: 502 });
  }
}
