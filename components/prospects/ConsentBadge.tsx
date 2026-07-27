import { ShieldCheck, ShieldAlert } from "lucide-react";

function fmtShort(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}

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
      {given ? `Consentement OK${at ? ` · ${fmtShort(at)}` : ""}` : "Consentement à recueillir"}
    </span>
  );
}
