import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndBumpAiUsage } from "@/lib/ai-rate-limit";

// POST { transcript: string } -> { summary, tags[], suggested_action, suggested_follow_up_date }
// Règle d'or #4 : l'IA RETIRE de la saisie. On renvoie une proposition, l'utilisateur valide.
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

  const { transcript } = await req.json();
  if (!transcript) return NextResponse.json({ error: "transcript manquant" }, { status: 400 });

  const todayISO = new Date().toISOString().slice(0, 10);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Tu assistes un commercial francophone après un appel de prospection. " +
          "À partir de sa note dictée, renvoie UNIQUEMENT un objet JSON : " +
          "{ \"summary\": string (1 phrase concise), " +
          "\"tags\": string[] (max 3 mots-clés), " +
          "\"suggested_action\": string (prochaine action, 1 phrase), " +
          "\"suggested_follow_up_date\": string|null (date ISO AAAA-MM-JJ si une relance est pertinente). " +
          `Date du jour : ${todayISO}. Interprète les échéances relatives (« après les vacances », « en septembre »).`,
      },
      { role: "user", content: transcript },
    ],
  });

  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "réponse IA illisible" }, { status: 502 });
  }
}
