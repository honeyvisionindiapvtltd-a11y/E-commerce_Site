/**
 * App Lifecycle Service
 * Handles app state changes, resume, pause, etc.
 */

import { App } from '@capacitor/app';

export type AppStateCallback = (state: 'resume' | 'pause' | 'destroy') => void;

export class AppLifecycleService {
  private static instance: AppLifecycleService;
  private callbacks: Map<string, AppStateCallback> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AppLifecycleService {
    if (!AppLifecycleService.instance) {
      AppLifecycleService.instance = new AppLifecycleService();
    }
    return AppLifecycleService.instance;
  }

  /**
   * Initialize app lifecycle handlers
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // App is about to enter foreground
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          this.notifyCallbacks('resume');
        } else {
          this.notifyCallbacks('pause');
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize app lifecycle service:', error);
    }
  }

  /**
   * Register callback for app state changes
   */
  onStateChange(id: string, callback: AppStateCallback): void {
    this.callbacks.set(id, callback);
  }

  /**
   * Unregister callback
   */
  offStateChange(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Notify all callbacks of state change
   */
  private notifyCallbacks(state: 'resume' | 'pause' | 'destroy'): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error(
          `Error in app lifecycle callback (${state}):`,
          error
        );
      }
    });
  }

  /**
   * Handle app resume - reconnect sockets, refresh data, etc.
   */
  async onAppResume(): Promise<void> {
    console.log('App resumed');
    
    // Reconnect Socket.IO if needed
    // Refresh user session
    // Refetch critical data
    // Resume geolocation tracking if needed
  }

  /**
   * Handle app pause - disconnect sockets, pause tracking, etc.
   */
  async onAppPause(): Promise<void> {
    console.log('App paused');
    
    // Stop geolocation tracking
    // Pause socket.io if needed
    // Save state to local storage
  }
}

export const appLifecycle = AppLifecycleService.getInstance();
