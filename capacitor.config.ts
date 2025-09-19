// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.needix.app',
  appName: 'Needix',
  webDir: 'out',  // Changed to 'out' directory for static export
  server: {
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#06b6d4',
      sound: 'beep.wav',
    },
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#000000',
    allowsLinkPreview: false
  },
  android: {
    backgroundColor: '#000000',
  }
};

export default config;