import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.orcapro.app",
  appName: "OrçaPro",
  webDir: "dist",
  server: {
    // O app nativo roda em https://localhost — o backend precisa aceitar essa origem no CORS
    androidScheme: "https",
  },
};

export default config;
