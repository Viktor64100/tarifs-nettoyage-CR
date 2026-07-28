"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("Email ou mot de passe incorrect.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">NextCall</h1>
        <p className="text-sub mt-1 mb-8">Connexion à votre espace.</p>
        <div className="flex flex-col gap-3">
          <input className="border border-line rounded-xl px-4 py-3 bg-card"
            placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="border border-line rounded-xl px-4 py-3 bg-card"
            placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-red text-sm">{error}</p>}
          <button onClick={signIn} disabled={loading}
            className="bg-accent text-white rounded-xl py-3 font-semibold disabled:opacity-60">
            {loading ? "…" : "Se connecter"}
          </button>
        </div>
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
