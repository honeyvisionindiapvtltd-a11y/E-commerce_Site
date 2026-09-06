/**
 * Native Initialization
 * Initialize all native services when the app starts
 */

import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { nativePlatform } from './nativePlatform';
import { androidBackButton } from './androidBackButton';
import { appLifecycle } from './appLifecycle';
import { networkStatus } from './networkStatus';
import { geolocation } from './geolocation';
import { pushNotifications } from './pushNotifications';
import { deepLinks } from './deepLinks';

/**
 * Initialize all native services
 */
export async function initializeNativeApp(): Promise<void> {
  try {
    const platform = nativePlatform.getPlatformInfo();
    console.log('Platform:', platform.platform);

    if (platform.isNative) {
      // Configure status bar
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.show();
      } catch (error) {
        console.warn('Failed to configure status bar:', error);
      }

      // Configure keyboard
      try {
        await Keyboard.hide();
      } catch (error) {
        console.warn('Failed to configure keyboard:', error);
      }

      // Initialize Android back button handler
      if (platform.isAndroid) {
        await androidBackButton.init();
        console.log('Android back button handler initialized');
      }

      // Initialize app lifecycle
      await appLifecycle.init();
      console.log('App lifecycle handler initialized');

      // Initialize network status monitoring
      await networkStatus.init();
      console.log('Network status monitoring initialized');

      // Initialize geolocation
      await geolocation.init();
      console.log('Geolocation service initialized');

      // Initialize deep links
      await deepLinks.init();
      console.log('Deep link handler initialized');

      // Push notifications require Firebase configuration on Android.
      if (import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true') {
        await pushNotifications.init({
          onSuccess: (token) => {
            console.log('Push notification token:', token);
            sendPushTokenToBackend(token);
          },
          onFailure: (error) => {
            console.error('Push notification failed:', error);
          },
          onNotificationReceived: (notification) => {
            console.log('Notification received:', notification);
          },
          onNotificationAction: (notification) => {
            console.log('Notification action:', notification);
            if (notification.notification?.data?.link) {
              window.location.hash = notification.notification.data.link;
            }
          },
        });
        console.log('Push notifications initialized');
      } else {
        console.log('Push notifications disabled for this build');
      }
    }

    console.log('Native app initialization complete');
  } catch (error) {
    console.error('Failed to initialize native app:', error);
  }
}

/**
 * Send push token to backend
 */
async function sendPushTokenToBackend(token: string): Promise<void> {
  try {
    const apiUrl = nativePlatform.getApiBaseUrl();
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.log('User not logged in, skip sending push token');
      return;
    }

    const response = await fetch(
      `${apiUrl}/users/${userId}/push-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ pushToken: token }),
      }
    );

    if (!response.ok) {
      console.warn('Failed to send push token to backend');
    }
  } catch (error) {
    console.error('Error sending push token to backend:', error);
  }
}
