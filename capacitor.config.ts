import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.onjeom.viewer',
  appName: '온점',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#F2EBDA',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#F2EBDA',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F7F1E3',
    },
  },
};

export default config;
