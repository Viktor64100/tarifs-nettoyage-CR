"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <LogoMark size={30} className="mx-auto mb-6" />
        <AlertTriangle size={28} className="text-amber mx-auto mb-3" />
        <h1 className="font-display text-xl font-semibold mb-1.5">Une erreur est survenue</h1>
        <p className="text-sub text-sm mb-6 leading-relaxed">
          Quelque chose s&apos;est mal passé de notre côté. Réessaie, et si le problème persiste, reviens un peu plus
          tard.
        </p>
        <button onClick={() => reset()} className="w-full bg-accent text-white rounded-xl py-3 font-semibold">
          Réessayer
        </button>
      </div>
    </main>
  );
}
