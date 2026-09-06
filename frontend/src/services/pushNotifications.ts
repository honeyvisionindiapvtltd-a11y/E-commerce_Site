/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging and Apple Push Notifications
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface PushNotificationHandler {
  onSuccess: (token: string) => void;
  onFailure: (error: any) => void;
  onNotificationReceived: (notification: any) => void;
  onNotificationAction: (notification: any) => void;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private handlers: Partial<PushNotificationHandler> = {};
  private isInitialized = false;
  private deviceToken: string | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications
   */
  async init(handlers: Partial<PushNotificationHandler>): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.handlers = handlers;

    try {
      // Request permission from user
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Get device token
      const registration = await PushNotifications.getDeliveryTokens();
      if (registration.fcmToken) {
        this.deviceToken = registration.fcmToken;
        this.handlers.onSuccess?.(registration.fcmToken);
      }

      // Set up listeners
      this.setupListeners();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      this.handlers.onFailure?.(error);
    }
  }

  /**
   * Set up push notification listeners
   */
  private setupListeners(): void {
    // Listen for registration token refresh
    PushNotifications.addListener('registration', (token) => {
      this.deviceToken = token.value;
      this.handlers.onSuccess?.(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      this.handlers.onFailure?.(error.error);
    });

    // Listen for notifications when app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      this.handlers.onNotificationReceived?.(notification);

      // Show local notification for foreground notifications
      if (notification.data) {
        this.showLocalNotification(notification);
      }
    });

    // Listen for notification taps
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      this.handlers.onNotificationAction?.(notification);
    });
  }

  /**
   * Show local notification (useful for foreground notifications)
   */
  private async showLocalNotification(notification: any): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.data?.title || 'HoneyVision',
            body: notification.data?.body || notification.title,
            id: Math.random() * 10000 | 0,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            smallIcon: 'ic_stat_ic_notification',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }

  /**
   * Get device token
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Unregister from push notifications
   */
  async unregister(): Promise<void> {
    try {
      await PushNotifications.unregister();
    } catch (error) {
      console.error('Failed to unregister from push notifications:', error);
    }
  }
}

export const pushNotifications = PushNotificationService.getInstance();
