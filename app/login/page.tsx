"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import Field from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("Email ou mot de passe incorrect.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Logo size={34} wordmarkClassName="text-3xl" />
        <p className="text-sub mt-2 mb-8">Connexion à ton espace.</p>
        <form onSubmit={signIn} className="flex flex-col gap-1">
          <Field label="Email">
            <input
              className="w-full border border-line rounded-xl px-4 py-3 bg-card text-base"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Mot de passe">
            <input
              className="w-full border border-line rounded-xl px-4 py-3 bg-card text-base"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-red text-sm mb-1">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white rounded-xl py-3 font-semibold disabled:opacity-60 mt-1.5"
          >
            {loading ? "…" : "Se connecter"}
          </button>
        </form>
        <p className="text-sub text-sm mt-4 text-center">
          <Link href="/forgot-password" className="text-accent font-medium">Mot de passe oublié ?</Link>
        </p>
        <p className="text-sub text-sm mt-2 text-center">
          Pas de compte ? <Link href="/signup" className="text-accent font-medium">Créer un compte</Link>
        </p>
        <p className="text-faint text-xs mt-6 text-center">
          <Link href="/privacy" className="text-faint underline">Politique de confidentialité</Link>
        </p>
      </div>
    </main>
  );
}
