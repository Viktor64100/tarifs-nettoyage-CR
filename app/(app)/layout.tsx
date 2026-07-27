import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TabBar from "@/components/TabBar";

// Layout des routes protégées. Le middleware bloque déjà les non-connectés
// et gère le gating de fin d'essai (redirection vers /billing).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-[460px] mx-auto min-h-screen pb-24">
      {children}
      <TabBar />
    </div>
  );
}
