import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Interaction, Prospect, ProspectStatus } from "@/types/db";
import { STATUS } from "@/lib/prospect-status";

export const metadata: Metadata = { title: "Statistiques" };

function startOfWeekISO() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function StatsPage() {
  const supabase = await createClient();
  const [{ data: prospectsData }, { data: interactionsData }] = await Promise.all([
    supabase.from("prospects").select("*"),
    supabase.from("interactions").select("*"),
  ]);

  const prospects = (prospectsData ?? []) as Prospect[];
  const interactions = (interactionsData ?? []) as Interaction[];
  const weekStart = startOfWeekISO();

  const statusCounts = prospects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ProspectStatus, number>
  );
  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  const callsTotal = interactions.length;
  const callsThisWeek = interactions.filter((i) => i.created_at >= weekStart).length;
  const rdvTotal = interactions.filter((i) => i.type === "rdv").length;
  const conversionRate = callsTotal ? Math.round((rdvTotal / callsTotal) * 100) : 0;

  return (
    <div className="px-5 pt-5 pb-8">
      <Link href="/settings" className="flex items-center gap-1 text-sub text-[15px] mb-3 -ml-1 px-1">
        <ChevronLeft size={18} /> Réglages
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-4">Statistiques</h1>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <StatTile n={prospects.length} label="prospects" />
        <StatTile n={callsTotal} label="appels au total" />
        <StatTile n={callsThisWeek} label="appels cette semaine" />
        <StatTile n={rdvTotal} label="rendez-vous obtenus" />
      </div>

      <div className="bg-card border border-line rounded-2xl p-4 mb-5">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-sub font-medium">Taux de transformation</span>
          <span className="font-display text-lg tabular-nums">{conversionRate}%</span>
        </div>
        <div className="text-faint text-xs">rendez-vous obtenus / appels logués</div>
      </div>

      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="text-sm text-sub font-medium mb-3">Répartition par statut</div>
        <div className="flex flex-col gap-2.5">
          {(Object.keys(STATUS) as ProspectStatus[]).map((key) => {
            const count = statusCounts[key] ?? 0;
            const meta = STATUS[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-sub w-[110px] shrink-0 truncate">{meta.label}</span>
                <div className="flex-1 h-2 rounded-full bg-track overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / maxStatusCount) * 100}%`, background: meta.color }}
                  />
                </div>
                <span className="text-xs font-display tabular-nums w-5 text-right shrink-0">{count}</span>
              </div>
            );
          })}
          {!prospects.length && <p className="text-faint text-sm text-center py-4">Aucune donnée pour l&apos;instant.</p>}
        </div>
      </div>
    </div>
  );
}

function StatTile({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-card border border-line rounded-2xl px-3.5 py-4">
      <div className="font-display text-2xl font-semibold tabular-nums leading-none">{n}</div>
      <div className="text-faint text-xs mt-1.5">{label}</div>
    </div>
  );
}
