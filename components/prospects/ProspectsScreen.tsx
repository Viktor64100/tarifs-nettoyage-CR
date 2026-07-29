"use client";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Upload, ChevronRight, Phone } from "lucide-react";
import type { Prospect, ProspectStatus } from "@/types/db";
import { StatusDot } from "./StatusChip";
import Avatar from "./Avatar";
import AddProspectSheet from "./AddProspectSheet";
import SwipeableRow from "./SwipeableRow";
import { createProspect, deleteProspect, type ProspectFormData } from "@/app/(app)/prospects/actions";
import { fmtDateShort, normalizePhoneKey, todayISO } from "@/lib/format";
import { STATUS } from "@/lib/prospect-status";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useRouter } from "next/navigation";

type ListAction = { type: "add"; prospect: Prospect } | { type: "remove"; id: string };

type SortKey = "recent" | "name" | "relance";
const FILTERS: { key: ProspectStatus | "tous"; label: string }[] = [
  { key: "tous", label: "Tous" },
  ...(Object.keys(STATUS) as ProspectStatus[]).map((key) => ({ key, label: STATUS[key].label })),
];

export default function ProspectsScreen({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<ProspectStatus | "tous">("tous");
  const [sort, setSort] = useState<SortKey>("recent");
  const [adding, setAdding] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const today = todayISO();

  const [optimisticProspects, dispatchOptimistic] = useOptimistic(
    prospects,
    (state, action: ListAction) =>
      action.type === "add"
        ? [action.prospect, ...state]
        : state.filter((p) => p.id !== action.id)
  );

  async function handleCreate(data: ProspectFormData): Promise<boolean> {
    const key = normalizePhoneKey(data.phone);
    const dup = key && optimisticProspects.find((p) => normalizePhoneKey(p.phone) === key);
    if (dup) {
      const proceed = await confirm({
        title: "Numéro déjà enregistré",
        message: `${dup.first_name} ${dup.last_name ?? ""} a déjà ce numéro (ou un numéro très proche). Ajouter quand même ce prospect ?`,
        confirmLabel: "Ajouter quand même",
        cancelLabel: "Annuler",
      });
      if (!proceed) return false;
    }

    const now = new Date().toISOString();
    startTransition(() => {
      dispatchOptimistic({
        type: "add",
        prospect: {
          id: `optimistic-${now}`,
          user_id: "",
          first_name: data.first_name,
          last_name: data.last_name || null,
          company: data.company || null,
          phone: data.phone,
          email: data.email || null,
          sector: data.sector || null,
          status: "nouveau",
          next_follow_up_at: null,
          consent_given: data.consent_given,
          consent_at: data.consent_given ? now : null,
          consent_source: data.consent_given ? data.consent_source || "Saisie manuelle" : null,
          created_at: now,
          updated_at: now,
        },
      });
    });
    try {
      await createProspect(data);
      toast("Prospect ajouté.");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ajout impossible.", "error");
    }
    return true;
  }

  async function handleDelete(p: Prospect) {
    const ok = await confirm({
      title: "Supprimer ce prospect ?",
      message: `${p.first_name} ${p.last_name ?? ""} et tout son historique seront définitivement supprimés.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    startTransition(() => {
      dispatchOptimistic({ type: "remove", id: p.id });
    });
    try {
      await deleteProspect(p.id);
      toast("Prospect supprimé.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Suppression impossible.", "error");
    } finally {
      router.refresh();
    }
  }

  const list = useMemo(() => {
    const needle = q.toLowerCase();
    let result = optimisticProspects.filter((p) => {
      if (filter !== "tous" && p.status !== filter) return false;
      if (!needle) return true;
      return `${p.first_name} ${p.last_name ?? ""} ${p.company ?? ""} ${p.phone}`.toLowerCase().includes(needle);
    });
    result = [...result].sort((a, b) => {
      if (sort === "name") return `${a.first_name} ${a.last_name ?? ""}`.localeCompare(`${b.first_name} ${b.last_name ?? ""}`);
      if (sort === "relance") {
        if (!a.next_follow_up_at && !b.next_follow_up_at) return 0;
        if (!a.next_follow_up_at) return 1;
        if (!b.next_follow_up_at) return -1;
        return a.next_follow_up_at.localeCompare(b.next_follow_up_at);
      }
      return b.created_at.localeCompare(a.created_at);
    });
    return result;
  }, [optimisticProspects, q, filter, sort]);

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

      <div className="flex items-center gap-2 bg-card border border-line rounded-xl px-3.5 py-2.5 mb-3">
        <Search size={17} className="text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, entreprise, téléphone…"
          className="border-none outline-none flex-1 text-base bg-transparent"
        />
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 pb-0.5" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border ${
                filter === f.key ? "bg-accent border-accent text-white" : "bg-card border-line text-sub"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-xs font-medium text-sub bg-card border border-line rounded-lg px-2.5 py-1.5"
          aria-label="Trier"
        >
          <option value="recent">Plus récents</option>
          <option value="name">Nom (A→Z)</option>
          <option value="relance">Prochaine relance</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {list.map((p) => {
          const tel = "tel:" + p.phone.replace(/\s/g, "");
          return (
            <div key={p.id} className="flex items-stretch gap-2">
              <SwipeableRow
                isOpen={openRowId === p.id}
                onOpenChange={(open) => setOpenRowId(open ? p.id : null)}
                onDelete={() => handleDelete(p)}
                deleteLabel={`Supprimer ${p.first_name}`}
              >
                <Link
                  href={`/prospects/${p.id}`}
                  className="flex items-center gap-3 bg-card border border-line rounded-2xl px-3.5 py-3 min-w-0"
                >
                  <Avatar firstName={p.first_name} lastName={p.last_name} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold truncate">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-sm text-sub mt-0.5 truncate">{p.company}</div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {p.next_follow_up_at && !["mauvais_numero", "pas_interesse", "rdv"].includes(p.status) && (
                      <span className={`text-xs font-display ${p.next_follow_up_at <= today ? "text-amber" : "text-faint"}`}>
                        {fmtDateShort(p.next_follow_up_at)}
                      </span>
                    )}
                    <StatusDot status={p.status} />
                    <ChevronRight size={17} className="text-faint" />
                  </div>
                </Link>
              </SwipeableRow>
              <a
                href={tel}
                aria-label={`Appeler ${p.first_name}`}
                className="w-11 shrink-0 grid place-items-center bg-accent-soft border border-accent-border rounded-2xl text-accent"
              >
                <Phone size={17} />
              </a>
            </div>
          );
        })}
        {!list.length && (
          <p className="text-faint text-center py-10 text-sm">
            {prospects.length ? "Aucun résultat." : "Aucun prospect. Touche + pour en ajouter."}
          </p>
        )}
      </div>

      {adding && <AddProspectSheet onClose={() => setAdding(false)} onCreate={handleCreate} />}
    </div>
  );
}
