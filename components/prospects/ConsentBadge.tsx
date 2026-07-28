import { ShieldCheck, ShieldAlert } from "lucide-react";
import { fmtTimestampShort } from "@/lib/format";

export default function ConsentBadge({
  given,
  at,
  center,
}: {
  given: boolean;
  at?: string | null;
  center?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${given ? "text-accent" : "text-amber"} ${center ? "justify-center" : ""}`}
    >
      {given ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
      {given ? `Consentement OK${at ? ` · ${fmtTimestampShort(at)}` : ""}` : "Consentement à recueillir"}
    </span>
  );
}
