import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.comander.app',
  appName: 'COMANDER',
  // Carpeta del export estático de Next.js (npm run build → /out).
  webDir: 'out',
  backgroundColor: '#000000',
  android: {
    backgroundColor: '#000000',
  },
};

export default config;
