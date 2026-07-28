import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client "service role" : contourne le RLS, réservé aux opérations serveur qui doivent
// agir en dehors du périmètre d'un utilisateur (ex. suppression de compte, webhook Stripe).
// Instanciation paresseuse pour ne pas faire échouer la collecte des routes par `next build`
// si la variable d'environnement n'est pas encore définie.
let admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!admin) {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return admin;
}
