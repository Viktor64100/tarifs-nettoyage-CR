"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Upload, ChevronRight } from "lucide-react";
import type { Prospect } from "@/types/db";
import { StatusDot } from "./StatusChip";
import AddProspectSheet from "./AddProspectSheet";

function fmtShort(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso + "T00:00:00"));
}

export default function ProspectsScreen({ prospects }: { prospects: Prospect[] }) {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const list = useMemo(() => {
    const needle = q.toLowerCase();
    if (!needle) return prospects;
    return prospects.filter((p) =>
      `${p.first_name} ${p.last_name ?? ""} ${p.company ?? ""} ${p.phone}`.toLowerCase().includes(needle)
    );
  }, [prospects, q]);

  return (
    <div className="px-5 pt-7">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Prospects</h1>
        <div className="flex gap-2">
          <Link
            href="/prospects/import"
            className="w-10 h-10 grid place-items-center rounded-xl border border-line bg-card"
            aria-label="Importer des prospects"
          >
            <Upload size={18} />
          </Link>
          <button
            onClick={() => setAdding(true)}
            className="w-10 h-10 grid place-items-center rounded-xl bg-accent text-white"
            aria-label="Ajouter un prospect"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card border border-line rounded-xl px-3.5 py-2.5 mb-4">
        <Search size={17} className="text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, entreprise, téléphone…"
          className="border-none outline-none flex-1 text-[15px] bg-transparent"
        />
      </div>

      <div className="flex flex-col gap-2">
        {list.map((p) => (
          <Link
            key={p.id}
            href={`/prospects/${p.id}`}
            className="flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3.5"
          >
            <div className="min-w-0">
              <div className="text-[16px] font-semibold">
                {p.first_name} {p.last_name}
              </div>
              <div className="text-sm text-sub mt-0.5 truncate">{p.company}</div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {p.next_follow_up_at && !["mauvais_numero", "pas_interesse", "rdv"].includes(p.status) && (
                <span className={`text-xs font-display ${p.next_follow_up_at <= today ? "text-amber" : "text-faint"}`}>
                  {fmtShort(p.next_follow_up_at)}
                </span>
              )}
              <StatusDot status={p.status} />
              <ChevronRight size={17} className="text-faint" />
            </div>
          </Link>
        ))}
        {!list.length && (
          <p className="text-faint text-center py-10 text-sm">
            {prospects.length ? "Aucun résultat." : "Aucun prospect. Touche + pour en ajouter."}
          </p>
        )}
      </div>

      {adding && <AddProspectSheet onClose={() => setAdding(false)} />}
    </div>
  );
}
