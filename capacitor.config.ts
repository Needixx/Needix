// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.needix.subtracker",
  appName: "Needix",
  webDir: "out", // not used when server.url is set
  server: {
    // ⬇️ use your real deployed URL here (no trailing slash)
    url: "https://needix.vercel.app",
    cleartext: true
  }
};

export default config;
