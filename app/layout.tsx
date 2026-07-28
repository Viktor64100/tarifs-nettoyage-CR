import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const description = "L'assistant qui organise votre prospection téléphonique.";

export const metadata: Metadata = {
  metadataBase: new URL("https://nextcall.tech"),
  title: {
    default: "NextCall",
    template: "%s — NextCall",
  },
  description,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "NextCall",
    description,
    url: "/",
    siteName: "NextCall",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NextCall" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextCall",
    description,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NextCall",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a7a55",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed top-2 left-2 z-[200] -translate-y-16 focus:translate-y-0 transition-transform bg-black text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Aller au contenu principal
        </a>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
