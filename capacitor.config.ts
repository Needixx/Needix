// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.needix.subtracker",
  appName: "Needix",
  webDir: "out",
  server: {
    // For development testing, use localhost directly
    url: "http://localhost:3000",
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
  }
};

export default config;