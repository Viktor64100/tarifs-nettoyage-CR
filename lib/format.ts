// Utilitaires de date partagés — évite de dupliquer Intl.DateTimeFormat("fr-FR", ...)
// dans chaque composant. Deux familles : les colonnes SQL `date` (sans heure,
// ex. next_follow_up_at) et les `timestamptz` (avec heure/fuseau, ex. created_at).

const DAY_MS = 86400000;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, n: number): string {
  return new Date(new Date(iso + "T00:00:00").getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

// "YYYY-MM-DD" -> "28 juil." (ajoute T00:00:00 pour éviter un décalage UTC).
export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso + "T00:00:00"));
}

// timestamptz complet -> "28 juil." (a déjà une heure/fuseau, pas d'ajout).
export function fmtTimestampShort(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}

// "lundi 28 juillet"
export function fmtLongDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "0612345678" -> "06 12 34 56 78". Conserve un préfixe international "+".
export function formatPhoneFR(raw: string): string {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  const grouped = digits.replace(/(\d{2})(?=\d)/g, "$1 ");
  return hasPlus ? `+${grouped}` : grouped;
}

// Clé de comparaison pour détecter les doublons, insensible au format et à
// l'indicatif : "06 12 34 56 78", "+33 6 12 34 56 78" et "0033612345678"
// donnent tous "612345678" (9 derniers chiffres significatifs en France).
export function normalizePhoneKey(raw: string): string {
  return raw.replace(/\D/g, "").slice(-9);
}
