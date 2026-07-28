const isProd = process.env.NODE_ENV === "production";

// CSP en 'unsafe-inline' pour script/style : Next.js injecte des scripts inline
// pour l'hydratation RSC, et l'app utilise des styles inline pour des valeurs
// calculées à l'exécution (barres de progression, couleurs de statut dynamiques).
// Un CSP à base de nonce serait plus strict mais demande une intégration middleware
// qu'on ne peut pas vérifier visuellement dans cet environnement — on privilégie
// ici une politique robuste mais sûre à déployer plutôt qu'un risque de casser
// le rendu. Le reste de la politique (connect-src, frame-ancestors, object-src…)
// reste strict.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
export default nextConfig;
