// capacitor.config.ts

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.needix.app',
  appName: 'Needix',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Point to your deployed website for API routes
    url: 'https://needix.vercel.app'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;