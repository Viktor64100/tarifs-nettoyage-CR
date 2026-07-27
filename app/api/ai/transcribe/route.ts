import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

// POST multipart (champ "audio") -> { text }
// Alternative sans coût : l'API Web Speech du navigateur (voir prototype). Ce endpoint
// sert de repli robuste / desktop.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ error: "audio manquant" }, { status: 400 });

  const result = await openai.audio.transcriptions.create({
    file: audio,
    model: "whisper-1",
    language: "fr",
  });
  return NextResponse.json({ text: result.text });
}
