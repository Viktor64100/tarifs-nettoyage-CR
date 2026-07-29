import type { Interaction } from "@/types/db";

// Créneaux horaires personnalisés : à partir de l'historique réel de l'utilisateur (et non
// d'une moyenne générique), identifie les tranches où le taux de décroché est le plus élevé.
// "injoignable" est le seul résultat qui signifie explicitement "pas décroché" — tous les
// autres (y compris mauvais numéro) impliquent qu'un appel a effectivement abouti.

const BUCKETS = [
  { label: "8h – 10h", start: 8, end: 10 },
  { label: "10h – 12h", start: 10, end: 12 },
  { label: "12h – 14h", start: 12, end: 14 },
  { label: "14h – 16h", start: 14, end: 16 },
  { label: "16h – 18h", start: 16, end: 18 },
  { label: "18h – 20h", start: 18, end: 20 },
] as const;

const MIN_SAMPLE_PER_BUCKET = 4;

const CALL_OUTCOME_TYPES = new Set([
  "injoignable",
  "interesse",
  "a_rappeler",
  "pas_interesse",
  "rdv",
  "mauvais_numero",
]);

// `Intl.DateTimeFormat("fr-FR", { hour: "numeric" }).format(...)` renvoie "10 h" (avec l'unité),
// pas "10" — Number() dessus vaut NaN. formatToParts() isole la valeur numérique brute, quel
// que soit le formatage propre à la locale.
function localHour(iso: string, timeZone: string): number {
  const part = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone })
    .formatToParts(new Date(iso))
    .find((p) => p.type === "hour");
  return Number(part?.value ?? NaN);
}

export type TimeSlotStat = { label: string; attempts: number; answered: number; rate: number };

export function bestCallTimes(interactions: Interaction[], timeZone = "Europe/Paris"): TimeSlotStat[] {
  const counts = BUCKETS.map(() => ({ attempts: 0, answered: 0 }));

  for (const i of interactions) {
    if (!CALL_OUTCOME_TYPES.has(i.type)) continue;
    const hour = localHour(i.created_at, timeZone);
    const bucketIdx = BUCKETS.findIndex((b) => hour >= b.start && hour < b.end);
    if (bucketIdx === -1) continue;
    counts[bucketIdx].attempts++;
    if (i.type !== "injoignable") counts[bucketIdx].answered++;
  }

  return BUCKETS.map((b, idx) => ({
    label: b.label,
    attempts: counts[idx].attempts,
    answered: counts[idx].answered,
    rate: counts[idx].attempts ? counts[idx].answered / counts[idx].attempts : 0,
  }))
    .filter((s) => s.attempts >= MIN_SAMPLE_PER_BUCKET)
    .sort((a, b) => b.rate - a.rate);
}
