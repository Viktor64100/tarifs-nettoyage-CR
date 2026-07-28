import type { ProspectStatus } from "@/types/db";

export const STATUS: Record<ProspectStatus, { label: string; color: string; soft: string }> = {
  nouveau: { label: "Nouveau", color: "var(--color-sub)", soft: "var(--color-neutral-soft)" },
  a_rappeler: { label: "À rappeler", color: "var(--color-amber)", soft: "var(--color-amber-soft)" },
  interesse: { label: "Intéressé", color: "var(--color-accent)", soft: "var(--color-accent-soft)" },
  rdv: { label: "RDV obtenu", color: "var(--color-accent-dk)", soft: "var(--color-accent-soft)" },
  pas_interesse: { label: "Pas intéressé", color: "var(--color-faint)", soft: "var(--color-neutral-soft)" },
  mauvais_numero: { label: "Mauvais numéro", color: "var(--color-red)", soft: "var(--color-red-soft)" },
  injoignable: { label: "Pas répondu", color: "var(--color-sub)", soft: "var(--color-neutral-soft)" },
};
