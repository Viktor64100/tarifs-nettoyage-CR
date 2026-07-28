"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import Field from "@/components/ui/Field";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Le lien reçu par mail établit une session "recovery" côté client (@supabase/ssr
    // détecte les tokens dans l'URL). On attend cet événement avant d'afficher le formulaire.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError("6 caractères minimum.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/login");
  }

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <LogoMark size={30} className="mb-3" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <p className="text-sub mt-1 mb-8">Choisis un nouveau mot de passe pour ton compte.</p>
        {!ready ? (
          <p className="text-sub text-sm">Vérification du lien…</p>
        ) : (
          <form onSubmit={updatePassword} className="flex flex-col gap-1">
            <Field label="Nouveau mot de passe">
              <input
                className="w-full border border-line rounded-xl px-4 py-3 bg-card text-base"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirmer le mot de passe">
              <input
                className="w-full border border-line rounded-xl px-4 py-3 bg-card text-base"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error && <p className="text-red text-sm mb-1">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-white rounded-xl py-3 font-semibold disabled:opacity-60 mt-1.5"
            >
              {loading ? "…" : "Mettre à jour"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
