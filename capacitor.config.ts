import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whoop.community',
  appName: 'WHOOP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for WHOOP strap...',
        cancel: 'Cancel',
        availableDevices: 'Available Devices',
        noDeviceFound: 'No WHOOP strap found',
      },
    },
  },
};

export default config;
