import type { CapacitorConfig } from '@capacitor/cli'

// Fase 7 — App móvil: la misma web empaquetada con Capacitor.
//   npm run build:native -w @fachapp/web   (build con base relativa)
//   npx cap sync                           (copia dist/ a android/ e ios/)
const config: CapacitorConfig = {
  appId: 'es.fachapp.app',
  appName: 'FachApp',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#fafaf9', showSpinner: false },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
}

export default config
