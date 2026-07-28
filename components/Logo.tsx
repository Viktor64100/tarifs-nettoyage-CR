// Marque NextCall : un "N" géométrique construit à partir de deux montants et
// d'une diagonale, dans l'esprit de la typo display (Space Grotesk). Dessiné
// à la main en SVG plutôt qu'un pictogramme téléphone générique.
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="NextCall"
    >
      <defs>
        <linearGradient id="nc-tile" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0C8A61" />
          <stop offset="1" stopColor="#075E42" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#nc-tile)" />
      <rect x="22" y="20" width="16" height="60" rx="2" fill="#fff" />
      <rect x="62" y="20" width="16" height="60" rx="2" fill="#fff" />
      <polygon points="28,20 44,20 72,80 56,80" fill="#fff" />
    </svg>
  );
}

export default function Logo({
  size = 30,
  className,
  wordmarkClassName,
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      <span className={`font-display font-semibold tracking-tight ${wordmarkClassName ?? "text-xl"}`}>
        NextCall
      </span>
    </span>
  );
}
