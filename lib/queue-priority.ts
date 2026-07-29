import type { Prospect } from "@/types/db";

// Score "prochain meilleur appel" : la vue SQL call_queue filtre déjà les bons prospects
// (statut éligible + relance due ou nouveau) mais les trie uniquement par date. Ce module
// affine l'ORDRE pour qu'un prospect à fort signal (intéressé) ou oublié depuis longtemps
// passe avant un simple "nouveau" sans historique, sans jamais changer QUI apparaît dans la file.
const STATUS_WEIGHT: Record<string, number> = {
  interesse: 3,
  a_rappeler: 2,
  nouveau: 1,
  injoignable: 0,
};

// Poids du retard : 0.15 point/jour, plafonné à 2 — assez pour faire remonter un suivi
// oublié depuis deux semaines devant un prospect fraîchement dû, sans jamais laisser un
// "nouveau" (presque toujours sans date, donc sans retard) dépasser un statut plus engagé.
const OVERDUE_POINTS_PER_DAY = 0.15;
const OVERDUE_CAP = 2;

function score(p: Prospect, todayISO: string): number {
  const base = STATUS_WEIGHT[p.status] ?? 0;
  if (!p.next_follow_up_at) return base;
  const overdueDays = Math.max(
    0,
    (new Date(todayISO).getTime() - new Date(p.next_follow_up_at).getTime()) / 86400000
  );
  return base + Math.min(OVERDUE_CAP, overdueDays * OVERDUE_POINTS_PER_DAY);
}

export function sortByPriority<T extends Prospect>(prospects: T[], todayISO: string): T[] {
  return [...prospects].sort((a, b) => {
    const diff = score(b, todayISO) - score(a, todayISO);
    if (diff !== 0) return diff;
    // Égalité : on retombe sur l'ordre d'origine (date de relance puis ancienneté),
    // déjà garanti par le tri de la vue call_queue.
    return 0;
  });
}
