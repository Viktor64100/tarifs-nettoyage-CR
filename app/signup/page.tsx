"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import Field from "@/components/ui/Field";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
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
        <LogoMark size={30} className="mb-3" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="text-sub mt-1 mb-8">14 jours d&apos;essai, sans carte.</p>
        <form onSubmit={signUp} className="flex flex-col gap-1">
          <Field label="Nom complet">
            <input
              className="w-full border border-line rounded-xl px-4 py-3 bg-card text-base"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
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
              autoComplete="new-password"
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
            {loading ? "…" : "Commencer l'essai"}
          </button>
        </form>
        <p className="text-sub text-sm mt-6 text-center">
          Déjà inscrit ? <Link href="/login" className="text-accent font-medium">Se connecter</Link>
        </p>
        <p className="text-faint text-xs mt-4 text-center leading-relaxed">
          En créant un compte, tu acceptes notre{" "}
          <Link href="/privacy" className="text-faint underline">politique de confidentialité</Link>.
        </p>
      </div>
    </main>
  );
}
