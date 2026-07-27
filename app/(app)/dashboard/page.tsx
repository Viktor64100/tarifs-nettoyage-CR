import { createClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types/db";

// Server Component : lit les données via RLS (l'utilisateur ne voit que les siennes).
export default async function Dashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: queue }, { count: callsToday }] = await Promise.all([
    supabase.from("profiles").select("daily_goal, company").single(),
    supabase.from("call_queue").select("*").limit(50),          // vue SQL définie dans la migration
    supabase.from("interactions").select("*", { count: "exact", head: true })
      .gte("created_at", today + "T00:00:00"),
  ]);

  const q = (queue ?? []) as Prospect[];
  const goal = profile?.daily_goal ?? 30;
  const calls = callsToday ?? 0;
  const relances = q.filter((p) => p.next_follow_up_at && p.next_follow_up_at <= today).length;
  const next = q[0];

  return (
    <div className="px-5 pt-7">
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-5">Aujourd&apos;hui</h1>

      <div className="flex gap-2.5 mb-5">
        <Stat n={calls} label="appels" />
        <Stat n={relances} label="relances" />
        <Stat n={0} label="rendez-vous" />
      </div>

      <div className="bg-card border border-line rounded-2xl p-4 mb-5">
        <div className="flex justify-between text-sm mb-2.5">
          <span className="text-sub">Objectif du jour</span>
          <span className="font-display tabular-nums">{calls} / {goal}</span>
        </div>
        <div className="h-2 rounded-full bg-[#edf1ef] overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all"
               style={{ width: `${Math.min(100, (calls / goal) * 100)}%` }} />
        </div>
      </div>

      {/* TODO : porter la "carte prochain appel" + le flux d'appel du prototype (nextcall-prototype.jsx) */}
      {next ? (
        <div className="bg-card border border-line rounded-2xl p-5">
          <div className="font-display text-xl font-semibold">{next.first_name} {next.last_name}</div>
          <div className="text-sub">{next.company}</div>
        </div>
      ) : (
        <p className="text-faint text-center py-10">File vide.</p>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex-1 bg-card border border-line rounded-2xl px-3 py-3.5">
      <div className="font-display text-2xl font-semibold tabular-nums leading-none">{n}</div>
      <div className="text-faint text-xs mt-1.5">{label}</div>
    </div>
  );
}
