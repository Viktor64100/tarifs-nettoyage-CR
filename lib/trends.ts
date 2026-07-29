import type { Interaction } from "@/types/db";

// Réalisation V1 de "détection d'objections récurrentes", volontairement simplifiée par
// rapport à l'idée initiale (faire analyser du texte libre par l'IA) : les ai_tags sont déjà
// extraits de façon structurée et fiable à chaque résumé post-appel (voir /api/ai/summarize).
// Les agréger en code est gratuit, instantané et sans aucun risque d'invention — contrairement
// à redemander à l'IA d'interpréter un historique de notes brutes.

const MIN_TAGGED_INTERACTIONS = 5;

export type TagTrend = { tag: string; count: number };

export type Trends = {
  topTags: TagTrend[];
  topObjection: TagTrend | null; // tag le plus fréquent parmi les issues "pas_interesse"
};

function topN(tags: string[], n: number): TagTrend[] {
  const counts = new Map<string, number>();
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function computeTrends(interactions: Interaction[]): Trends | null {
  const tagged = interactions.filter((i) => i.ai_tags && i.ai_tags.length > 0);
  if (tagged.length < MIN_TAGGED_INTERACTIONS) return null;

  const allTags = tagged.flatMap((i) => i.ai_tags);
  const topTags = topN(allTags, 5);

  const objectionTags = tagged.filter((i) => i.type === "pas_interesse").flatMap((i) => i.ai_tags);
  const topObjection = objectionTags.length ? topN(objectionTags, 1)[0] : null;

  return { topTags, topObjection };
}
