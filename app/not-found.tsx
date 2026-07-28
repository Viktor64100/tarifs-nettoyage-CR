import Link from "next/link";
import { SearchX } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <LogoMark size={30} className="mx-auto mb-6" />
        <SearchX size={28} className="text-faint mx-auto mb-3" />
        <h1 className="font-display text-xl font-semibold mb-1.5">Page introuvable</h1>
        <p className="text-sub text-sm mb-6 leading-relaxed">Cette page n&apos;existe pas ou plus.</p>
        <Link href="/dashboard" className="block w-full bg-accent text-white rounded-xl py-3 font-semibold">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
