import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CircleCheck, Flame, Phone, Sparkles, Target, Timer, Upload, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types/db";
import { StatusChip } from "@/components/prospects/StatusChip";
import ConsentBadge from "@/components/prospects/ConsentBadge";
import { fmtLongDate, capitalize } from "@/lib/format";
import { sortByPriority } from "@/lib/queue-priority";
import { getWeeklyCoaching } from "@/lib/weekly-coaching";

export const metadata: Metadata = { title: "Aujourd'hui" };

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

// Nombre de jours consécutifs (jusqu'à hier ou aujourd'hui) avec au moins un appel logué.
// Si aucun appel n'a encore eu lieu aujourd'hui, la série reste "active" jusqu'à minuit —
// elle ne se réinitialise que si un jour entier passe sans aucune activité.
function computeStreak(activeDates: Set<string>, todayISO: string): number {
  const cursor = new Date(todayISO + "T00:00:00");
  if (!activeDates.has(todayISO)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Server Component : lit les données via RLS (l'utilisateur ne voit que les siennes).
export default async function Dashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const streakWindowStart = new Date(Date.now() - 60 * 86400000).toISOString();

  const [
    { data: profile },
    { data: queue },
    { count: callsToday },
    { count: rdvToday },
    { count: totalProspects },
    { data: recentInteractions },
  ] = await Promise.all([
    supabase.from("profiles").select("daily_goal, company, full_name").single(),
    supabase.from("call_queue").select("*").limit(50), // vue SQL définie dans la migration
    supabase.from("interactions").select("*", { count: "exact", head: true }).gte("created_at", today + "T00:00:00"),
    supabase
      .from("interactions")
      .select("*", { count: "exact", head: true })
      .eq("type", "rdv")
      .gte("created_at", today + "T00:00:00"),
    supabase.from("prospects").select("*", { count: "exact", head: true }),
    supabase.from("interactions").select("created_at").gte("created_at", streakWindowStart),
  ]);

  const q = sortByPriority((queue ?? []) as Prospect[], today);
  const goal = profile?.daily_goal ?? 30;
  const calls = callsToday ?? 0;
  const rdv = rdvToday ?? 0;
  const relances = q.filter((p) => p.next_follow_up_at && p.next_follow_up_at <= today).length;
  const next = q[0];
  const hasAnyProspect = (totalProspects ?? 0) > 0;
  const activeDates = new Set((recentInteractions ?? []).map((i) => (i.created_at as string).slice(0, 10)));
  const streak = computeStreak(activeDates, today);

  let weeklyCoaching: string | null = null;
  if (hasAnyProspect) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) weeklyCoaching = await getWeeklyCoaching(supabase, user.id);
  }

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

  const firstName = profile?.full_name?.trim().split(" ")[0];

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.12em] uppercase text-faint font-semibold">
          {capitalize(fmtLongDate())}
        </div>
        {streak >= 1 && (
          <div className="flex items-center gap-1 text-amber text-xs font-semibold bg-amber-soft border border-amber-border rounded-full px-2.5 py-1">
            <Flame size={13} className="fill-amber" /> {streak} jour{streak > 1 ? "s" : ""} de suite
          </div>
        )}
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mt-1 mb-5">
        {firstName ? `Bonjour ${firstName}` : "Aujourd'hui"}
      </h1>

      {weeklyCoaching && (
        <div className="flex items-start gap-2.5 bg-accent-soft border border-accent-border rounded-2xl px-4 py-3.5 mb-5">
          <Sparkles size={16} className="text-accent-dk shrink-0 mt-0.5" />
          <p className="text-sm text-accent-dk leading-relaxed">{weeklyCoaching}</p>
        </div>
      )}

      {!hasAnyProspect ? (
        <div className="bg-card border border-line rounded-2xl px-5 py-9 text-center">
          <div className="w-14 h-14 rounded-full bg-accent-soft grid place-items-center mx-auto mb-4">
            <UserPlus size={26} className="text-accent" />
          </div>
          <div className="font-display text-xl font-semibold">Bienvenue sur NextCall</div>
          <div className="text-sub text-[14.5px] mt-1.5 leading-relaxed max-w-[280px] mx-auto">
            Ajoute tes premiers prospects pour construire ta file d&apos;appels du jour et commencer à prospecter.
          </div>
          <Link
            href="/prospects"
            className="w-full mt-5 bg-accent text-white rounded-2xl py-3.5 font-semibold text-[15.5px] flex items-center justify-center gap-2"
            style={{ boxShadow: "0 6px 16px rgba(10,122,85,.28)" }}
          >
            <UserPlus size={18} /> Ajouter mes premiers prospects
          </Link>
          <Link
            href="/prospects/import"
            className="w-full mt-2.5 bg-transparent text-sub text-sm font-medium flex items-center justify-center gap-1.5 py-2"
          >
            <Upload size={14} /> ou importer un fichier CSV
          </Link>
        </div>
      ) : (
        <>
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
            <div className="h-2 rounded-full bg-track overflow-hidden">
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
                <>
                  <div className="text-center text-faint text-[13.5px] mt-3">
                    {q.length - 1} autre{q.length > 2 ? "s" : ""} dans la file
                  </div>
                  <Link
                    href="/call?sprint=20"
                    className="w-full mt-2.5 flex items-center justify-center gap-1.5 text-accent-dk text-sm font-semibold py-1.5"
                  >
                    <Timer size={15} /> Lancer un sprint de 20 min
                  </Link>
                </>
              )}
            </>
          ) : (
            <div className="bg-card border border-dashed border-line rounded-2xl px-5 py-9 text-center">
              <CircleCheck size={30} className="text-accent mx-auto mb-2.5" />
              <div className="font-display text-lg font-semibold">Tu es à jour !</div>
              <div className="text-sub text-[14.5px] mt-1">
                Aucun appel en attente aujourd&apos;hui. Les prochaines relances programmées apparaîtront ici.
              </div>
              <Link
                href="/prospects"
                className="inline-flex mt-4 text-accent text-sm font-semibold items-center gap-1"
              >
                Voir tous mes prospects <span aria-hidden>→</span>
              </Link>
            </div>
          )}
        </>
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
