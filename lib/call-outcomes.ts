import { PhoneMissed, Check, CalendarClock, Handshake, X, PhoneOff, type LucideIcon } from "lucide-react";
import type { InteractionType } from "@/types/db";

export type OutcomeKind = "requeue" | "schedule" | "won" | "terminal";

export type Outcome = {
  key: InteractionType;
  label: string;
  Icon: LucideIcon;
  toneClass: string;
  kind: OutcomeKind;
  defaultDelayDays?: number;
};

export const OUTCOMES: Outcome[] = [
  { key: "injoignable", label: "Pas répondu", Icon: PhoneMissed, toneClass: "text-sub", kind: "requeue" },
  { key: "interesse", label: "Intéressé", Icon: Check, toneClass: "text-accent", kind: "schedule", defaultDelayDays: 3 },
  { key: "a_rappeler", label: "À rappeler", Icon: CalendarClock, toneClass: "text-amber", kind: "schedule", defaultDelayDays: 1 },
  { key: "rdv", label: "RDV obtenu", Icon: Handshake, toneClass: "text-accent-dk", kind: "won" },
  { key: "pas_interesse", label: "Pas intéressé", Icon: X, toneClass: "text-faint", kind: "terminal" },
  { key: "mauvais_numero", label: "Mauvais numéro", Icon: PhoneOff, toneClass: "text-red", kind: "terminal" },
];

const dayMs = 86400000;
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
export function addDaysISO(iso: string, n: number) {
  return new Date(new Date(iso + "T00:00:00").getTime() + n * dayMs).toISOString().slice(0, 10);
}
export function fmtShortISO(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso + "T00:00:00"));
}
