import type { ProspectStatus } from "@/types/db";

export const STATUS: Record<ProspectStatus, { label: string; color: string; soft: string }> = {
  nouveau: { label: "Nouveau", color: "var(--color-sub)", soft: "#EEF1F0" },
  a_rappeler: { label: "À rappeler", color: "var(--color-amber)", soft: "#FAEFDA" },
  interesse: { label: "Intéressé", color: "var(--color-accent)", soft: "var(--color-accent-soft)" },
  rdv: { label: "RDV obtenu", color: "var(--color-accent-dk)", soft: "var(--color-accent-soft)" },
  pas_interesse: { label: "Pas intéressé", color: "var(--color-faint)", soft: "#EEF1F0" },
  mauvais_numero: { label: "Mauvais numéro", color: "var(--color-red)", soft: "#F5E5E0" },
  injoignable: { label: "Pas répondu", color: "var(--color-sub)", soft: "#EEF1F0" },
};
