import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";

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
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
