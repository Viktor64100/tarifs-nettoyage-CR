"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendReset() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sub mt-1 mb-8">
          {sent
            ? "Vérifie ta boîte mail pour le lien de réinitialisation."
            : "On t'envoie un lien pour en choisir un nouveau."}
        </p>
        {!sent && (
          <div className="flex flex-col gap-3">
            <input
              className="border border-line rounded-xl px-4 py-3 bg-card"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red text-sm">{error}</p>}
            <button
              onClick={sendReset}
              disabled={loading || !email}
              className="bg-accent text-white rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "…" : "Envoyer le lien"}
            </button>
          </div>
        )}
        <p className="text-sub text-sm mt-6 text-center">
          <Link href="/login" className="text-accent font-medium">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
