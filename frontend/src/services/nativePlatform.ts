/**
 * Native Platform Service
 * Handles platform detection and native functionality
 */

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface PlatformInfo {
  platform: 'web' | 'android' | 'ios';
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
  capacitorVersion: string;
}

export class NativePlatformService {
  private static instance: NativePlatformService;
  private platformInfo: PlatformInfo | null = null;

  private constructor() {}

  static getInstance(): NativePlatformService {
    if (!NativePlatformService.instance) {
      NativePlatformService.instance = new NativePlatformService();
    }
    return NativePlatformService.instance;
  }

  /**
   * Get platform information
   */
  getPlatformInfo(): PlatformInfo {
    if (!this.platformInfo) {
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();

      this.platformInfo = {
        platform: platform as 'web' | 'android' | 'ios',
        isNative,
        isAndroid: platform === 'android',
        isIOS: platform === 'ios',
        isWeb: platform === 'web',
        capacitorVersion: '6',
      };
    }

    return this.platformInfo;
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check if running on Android
   */
  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  /**
   * Check if running on iOS
   */
  isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  /**
   * Check if running on web
   */
  isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  /**
   * Get API base URL based on platform and environment
   */
  getApiBaseUrl(): string {
    const env = import.meta.env.VITE_API_URL;
    
    if (env) {
      return env;
    }

    if (this.isNativePlatform()) {
      return 'https://api.honeyvision.in/api';
    }

    return '/api'; // Web or fallback
  }

  /**
   * Exit app (native only)
   */
  async exitApp(): Promise<void> {
    if (this.isNativePlatform()) {
      await App.exitApp();
    } else {
      console.warn('exitApp is only available on native platforms');
    }
  }

  /**
   * Get app info
   */
  async getAppInfo() {
    if (this.isNativePlatform()) {
      return await App.getInfo();
    }
    return null;
  }
}

export const nativePlatform = NativePlatformService.getInstance();
