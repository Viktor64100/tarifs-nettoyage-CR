import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TabBar from "@/components/TabBar";

// Layout des routes protégées. Le middleware bloque déjà les non-connectés ;
// on revérifie ici et on pourra brancher le gating d'abonnement (trial expiré).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // TODO (semaine 3) : si profile.plan === 'trial' && trial_ends_at < now && pas d'abo actif
  //                    -> rediriger vers /settings/billing.

  return (
    <div className="max-w-[460px] mx-auto min-h-screen pb-24">
      {children}
      <TabBar />
    </div>
  );
}
