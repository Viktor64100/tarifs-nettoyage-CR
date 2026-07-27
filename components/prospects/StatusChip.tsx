import type { ProspectStatus } from "@/types/db";
import { STATUS } from "@/lib/prospect-status";

export function StatusChip({ status, center }: { status: ProspectStatus; center?: boolean }) {
  const s = STATUS[status] ?? STATUS.nouveau;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${center ? "mx-auto" : ""}`}
      style={{ background: s.soft, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function StatusDot({ status }: { status: ProspectStatus }) {
  const s = STATUS[status] ?? STATUS.nouveau;
  return <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ background: s.color }} />;
}
