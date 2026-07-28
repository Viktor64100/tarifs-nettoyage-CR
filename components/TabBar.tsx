"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Settings as SettingsIcon } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Aujourd'hui", Icon: Home },
  { href: "/prospects", label: "Prospects", Icon: Users },
  { href: "/settings", label: "Réglages", Icon: SettingsIcon },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  // Le flux d'appel occupe tout l'écran, comme dans le prototype : pas de barre d'onglets.
  if (pathname.startsWith("/call")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
      <div
        className="w-full max-w-[460px] flex bg-card/92 backdrop-blur-md border-t border-line pointer-events-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 pb-3.5 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 focus-visible:rounded-xl"
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 2} className={active ? "text-accent" : "text-faint"} />
              <span className={`text-[11px] ${active ? "font-semibold text-accent" : "font-medium text-faint"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
