import Link from "next/link";
import { CalendarClock, CircleCheck, Phone, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types/db";
import { StatusChip } from "@/components/prospects/StatusChip";
import ConsentBadge from "@/components/prospects/ConsentBadge";

function relDay(iso: string | null) {
  if (!iso) return "";
  const diff = Math.round(
    (new Date(iso + "T00:00:00").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime()) /
      86400000
  );
  if (diff < 0) return `en retard de ${Math.abs(diff)} j`;
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return "demain";
  return `dans ${diff} j`;
}

// Server Component : lit les données via RLS (l'utilisateur ne voit que les siennes).
export default async function Dashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: queue }, { count: callsToday }, { count: rdvToday }] = await Promise.all([
    supabase.from("profiles").select("daily_goal, company").single(),
    supabase.from("call_queue").select("*").limit(50), // vue SQL définie dans la migration
    supabase.from("interactions").select("*", { count: "exact", head: true }).gte("created_at", today + "T00:00:00"),
    supabase
      .from("interactions")
      .select("*", { count: "exact", head: true })
      .eq("type", "rdv")
      .gte("created_at", today + "T00:00:00"),
  ]);

  const q = (queue ?? []) as Prospect[];
  const goal = profile?.daily_goal ?? 30;
  const calls = callsToday ?? 0;
  const rdv = rdvToday ?? 0;
  const relances = q.filter((p) => p.next_follow_up_at && p.next_follow_up_at <= today).length;
  const next = q[0];

  let lastNote: string | null = null;
  if (next) {
    const { data: lastInteraction } = await supabase
      .from("interactions")
      .select("note")
      .eq("prospect_id", next.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastNote = lastInteraction?.note ?? null;
  }

  return (
    <div className="px-5 pt-7">
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-5">Aujourd&apos;hui</h1>

      <div className="flex gap-2.5 mb-5">
        <Stat n={calls} label="appels" />
        <Stat n={relances} label="relances" tone={relances ? "text-amber" : ""} />
        <Stat n={rdv} label="rendez-vous" tone={rdv ? "text-accent" : ""} />
      </div>

      <div className="bg-card border border-line rounded-2xl p-4 mb-5">
        <div className="flex justify-between items-center text-sm mb-2.5">
          <span className="flex items-center gap-1.5 text-sub font-medium">
            <Target size={15} className="text-accent" /> Objectif du jour
          </span>
          <span className="font-display tabular-nums">
            {calls} / {goal}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#edf1ef] overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${Math.min(100, (calls / goal) * 100)}%` }}
          />
        </div>
      </div>

      <div className="text-xs tracking-wide uppercase text-faint font-semibold mb-2.5 mt-1 px-0.5">
        Prochain appel
      </div>

      {next ? (
        <>
          <Link href={`/prospects/${next.id}`} className="block bg-card border border-line rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-display text-xl font-semibold">
                  {next.first_name} {next.last_name}
                </div>
                <div className="text-sub mt-0.5">{next.company}</div>
              </div>
              <StatusChip status={next.status} />
            </div>
            {next.next_follow_up_at && (
              <div className="flex items-center gap-1.5 mt-3 text-amber text-[13.5px] font-medium">
                <CalendarClock size={14} /> Relance {relDay(next.next_follow_up_at)}
              </div>
            )}
            <div className="mt-2.5">
              <ConsentBadge given={next.consent_given} at={next.consent_at} />
            </div>
            {lastNote && (
              <div className="mt-3 px-3 py-2.5 bg-bg rounded-xl text-sm text-sub leading-relaxed">{lastNote}</div>
            )}
          </Link>

          <Link
            href="/call"
            className="w-full mt-3.5 bg-accent text-white rounded-2xl py-[17px] font-semibold text-[16.5px] flex items-center justify-center gap-2.5"
            style={{ boxShadow: "0 6px 16px rgba(10,122,85,.28)" }}
          >
            <Phone size={19} /> Appeler le prochain prospect
          </Link>
          {q.length > 1 && (
            <div className="text-center text-faint text-[13.5px] mt-3">
              {q.length - 1} autre{q.length > 2 ? "s" : ""} dans la file
            </div>
          )}
        </>
      ) : (
        <div className="bg-card border border-dashed border-line rounded-2xl px-5 py-9 text-center">
          <CircleCheck size={30} className="text-accent mx-auto mb-2.5" />
          <div className="font-display text-lg font-semibold">File vide</div>
          <div className="text-sub text-[14.5px] mt-1">
            Aucun appel en attente. Ajoute des prospects ou reviens à la prochaine relance.
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label, tone = "" }: { n: number; label: string; tone?: string }) {
  return (
    <div className="flex-1 bg-card border border-line rounded-2xl px-3 py-3.5">
      <div className={`font-display text-2xl font-semibold tabular-nums leading-none ${tone}`}>{n}</div>
      <div className="text-faint text-xs mt-1.5">{label}</div>
    </div>
  );
}
