/**
 * Network Status Service
 * Handles online/offline state and network conditions
 */

import { Network } from '@capacitor/network';

export type NetworkStatusCallback = (status: NetworkStatus) => void;

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  isOnline: boolean;
}

export class NetworkStatusService {
  private static instance: NetworkStatusService;
  private callbacks: Map<string, NetworkStatusCallback> = new Map();
  private currentStatus: NetworkStatus = {
    connected: true,
    connectionType: 'wifi',
    isOnline: true,
  };
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NetworkStatusService {
    if (!NetworkStatusService.instance) {
      NetworkStatusService.instance = new NetworkStatusService();
    }
    return NetworkStatusService.instance;
  }

  /**
   * Initialize network status monitoring
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get initial status
      const status = await Network.getStatus();
      this.updateStatus(status);

      // Listen to network changes
      Network.addListener('networkStatusChange', (status) => {
        this.updateStatus(status);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize network status service:', error);
    }
  }

  /**
   * Update network status and notify callbacks
   */
  private updateStatus(status: any): void {
    this.currentStatus = {
      connected: status.connected,
      connectionType: status.connectionType || 'unknown',
      isOnline: status.connected,
    };

    console.log('Network status changed:', this.currentStatus);
    this.notifyCallbacks();
  }

  /**
   * Register callback for network status changes
   */
  onStatusChange(id: string, callback: NetworkStatusCallback): void {
    this.callbacks.set(id, callback);
    // Call immediately with current status
    callback(this.currentStatus);
  }

  /**
   * Unregister callback
   */
  offStatusChange(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in network status callback:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Get connection type
   */
  getConnectionType(): string {
    return this.currentStatus.connectionType;
  }

  /**
   * Check if using mobile data
   */
  isUsingMobileData(): boolean {
    return this.currentStatus.connectionType === 'cellular';
  }

  /**
   * Check if using WiFi
   */
  isUsingWiFi(): boolean {
    return this.currentStatus.connectionType === 'wifi';
  }
}

export const networkStatus = NetworkStatusService.getInstance();
