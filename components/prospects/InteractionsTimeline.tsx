import type { Interaction } from "@/types/db";
import { STATUS } from "@/lib/prospect-status";
import { fmtTimestampShort } from "@/lib/format";

const EXTRA_LABELS: Record<string, string> = {
  note: "Note",
  voice_note: "Note vocale",
};

export default function InteractionsTimeline({ interactions }: { interactions: Interaction[] }) {
  if (!interactions.length) {
    return <div className="text-faint text-sm py-2">Aucun appel encore.</div>;
  }

  return (
    <div className="flex flex-col">
      {interactions.map((h, i) => {
        const meta = STATUS[h.type as keyof typeof STATUS];
        const label = meta?.label ?? EXTRA_LABELS[h.type] ?? h.type;
        const color = meta?.color ?? "var(--color-sub)";
        return (
          <div key={h.id} className="flex gap-3 pb-3.5">
            <div className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              {i < interactions.length - 1 && <div className="w-px flex-1 bg-line mt-1" />}
            </div>
            <div className="flex-1 -mt-0.5">
              <div className="flex justify-between">
                <span className="text-[14.5px] font-semibold" style={{ color }}>
                  {label}
                </span>
                <span className="text-xs text-faint font-display">{fmtTimestampShort(h.created_at)}</span>
              </div>
              {h.note && <div className="text-sm text-sub mt-1 leading-relaxed">{h.note}</div>}
              {h.ai_summary && (
                <div className="text-sm text-sub mt-1.5 leading-relaxed bg-bg rounded-xl px-2.5 py-2">
                  <span className="text-accent-dk font-medium">Résumé IA · </span>
                  {h.ai_summary}
                </div>
              )}
              {h.ai_tags && h.ai_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {h.ai_tags.map((tag) => (
                    <span key={tag} className="text-xs bg-card border border-line rounded-full px-2 py-0.5 text-sub">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
