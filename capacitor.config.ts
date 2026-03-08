import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.openquant.app',
  appName: 'OpenQuant',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
