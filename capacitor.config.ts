import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.honeyvision.app',
  appName: 'HoneyVision',
  webDir: 'dist',
  bundledWebRuntime: false,
  
  // Server configuration
  server: {
    androidScheme: 'https',
    url: undefined, // Set dynamically if needed
    cleartext: true, // Allow cleartext traffic for development
  },

  // Platform-specific configurations
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    limitsNavigationsToAppBoundDomains: true,
  },

  // Plugins configuration
  plugins: {
    App: {
      // Handle app lifecycle events
    },
    Camera: {
      // Camera plugin configuration
      saveToGallery: true,
    },
    Geolocation: {
      // Geolocation plugin configuration
    },
    LocalNotifications: {
      // Local notifications configuration
    },
    Keyboard: {
      // Keyboard configuration
      resize: 'native',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      // Status bar configuration
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
    PushNotifications: {
      // Push notifications configuration for Android
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
