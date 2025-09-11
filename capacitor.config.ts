// capacitor.config.ts

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.needix.subtracker', // Update this to be unique
  appName: 'SubTracker',
  webDir: 'dist', // or 'build' depending on your build output
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK'
    }
  },
  ios: {
    scheme: 'SubTracker',
    backgroundColor: '#667eea'
  }
};

export default config;