import type { CapacitorConfig } from "@capacitor/cli";

// NextCall utilise des Server Actions et du SSR (auth, données du dashboard) : impossible à
// exporter en statique. La WebView charge donc l'app en direct depuis le domaine de production,
// exactement comme un navigateur — pas de bundle local à maintenir en double.
const config: CapacitorConfig = {
  appId: "tech.nextcall.app",
  appName: "NextCall",
  webDir: "public",
  server: {
    url: "https://nextcall.tech",
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0a7a55",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
