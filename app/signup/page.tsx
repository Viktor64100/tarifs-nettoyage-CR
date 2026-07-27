"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    // Le trigger handle_new_user crée le profil (essai 14 jours).
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="text-sub mt-1 mb-8">14 jours d'essai, sans carte.</p>
        <div className="flex flex-col gap-3">
          <input className="border border-line rounded-xl px-4 py-3 bg-card"
            placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className="border border-line rounded-xl px-4 py-3 bg-card"
            placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="border border-line rounded-xl px-4 py-3 bg-card"
            placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-red text-sm">{error}</p>}
          <button onClick={signUp} disabled={loading}
            className="bg-accent text-white rounded-xl py-3 font-semibold disabled:opacity-60">
            {loading ? "…" : "Commencer l'essai"}
          </button>
        </div>
        <p className="text-sub text-sm mt-6 text-center">
          Déjà inscrit ? <Link href="/login" className="text-accent font-medium">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
