import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.nsec.native',
  appName: 'Nsec.app',
  webDir: './packages/client/build',
  ios: {
    limitsNavigationsToAppBoundDomains: true,
  },
  // If you want to use a service worker, you need to include the code below:
  // server: {
  //   // url: 'http://192.168.31.132:3000', // for test on real phone
  //   url: 'http://localhost:3000', // for test on emulator
  //   cleartext: true,
  // },
}

export default config
