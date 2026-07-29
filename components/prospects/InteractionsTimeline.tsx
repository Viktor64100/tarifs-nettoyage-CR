import { CalendarPlus, Download } from "lucide-react";
import type { Interaction, Prospect } from "@/types/db";
import { STATUS } from "@/lib/prospect-status";
import { fmtTimestampShort } from "@/lib/format";
import { buildICS, downloadICS, googleCalendarUrl } from "@/lib/calendar";

const EXTRA_LABELS: Record<string, string> = {
  note: "Note",
  voice_note: "Note vocale",
};

export default function InteractionsTimeline({
  interactions,
  prospect,
}: {
  interactions: Interaction[];
  prospect: Prospect;
}) {
  if (!interactions.length) {
    return <div className="text-faint text-sm py-2">Aucun appel encore.</div>;
  }

  return (
    <div className="flex flex-col">
      {interactions.map((h, i) => {
        const meta = STATUS[h.type as keyof typeof STATUS];
        const label = meta?.label ?? EXTRA_LABELS[h.type] ?? h.type;
        const color = meta?.color ?? "var(--color-sub)";
        const meetingAt = h.meeting_at ? new Date(h.meeting_at) : null;
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
              {meetingAt && (
                <MeetingActions prospect={prospect} meetingAt={meetingAt} note={h.note} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MeetingActions({
  prospect,
  meetingAt,
  note,
}: {
  prospect: Prospect;
  meetingAt: Date;
  note: string | null;
}) {
  const title = `RDV NextCall — ${prospect.first_name} ${prospect.last_name ?? ""}`.trim();
  const description = [prospect.company, prospect.phone, note?.trim()].filter(Boolean).join(" · ");
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(meetingAt);

  return (
    <div className="mt-1.5 bg-accent-soft border border-accent-border rounded-xl px-2.5 py-2">
      <div className="text-xs text-accent-dk font-semibold capitalize mb-1.5">{formatted}</div>
      <div className="flex gap-1.5">
        <a
          href={googleCalendarUrl({ title, description, start: meetingAt })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-accent-dk no-underline"
        >
          <CalendarPlus size={12} /> Google Calendar
        </a>
        <span className="text-accent-border">·</span>
        <button
          onClick={() => downloadICS(`rdv-${prospect.first_name}.ics`, buildICS({ title, description, start: meetingAt }))}
          className="flex items-center gap-1 text-xs font-medium text-accent-dk"
        >
          <Download size={12} /> .ics
        </button>
      </div>
    </div>
  );
}
