/**
 * Geolocation Service
 * Handles GPS and location tracking for delivery and user location
 */

import { Geolocation } from '@capacitor/geolocation';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationWatchOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private watchId: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Initialize geolocation
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if geolocation is supported
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        console.warn('Geolocation permission not granted');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize geolocation:', error);
    }
  }

  /**
   * Check location permission
   */
  async checkPermission(): Promise<boolean> {
    try {
      const permission = await Geolocation.checkPermissions();
      return (
        permission.location === 'granted' ||
        permission.location === 'prompt-once'
      );
    } catch (error) {
      console.error('Failed to check geolocation permission:', error);
      return false;
    }
  }

  /**
   * Request location permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch (error) {
      console.error('Failed to request geolocation permission:', error);
      return false;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy || undefined,
        altitude: coordinates.coords.altitude || undefined,
        altitudeAccuracy:
          coordinates.coords.altitudeAccuracy || undefined,
        heading: coordinates.coords.heading || undefined,
        speed: coordinates.coords.speed || undefined,
        timestamp: coordinates.timestamp,
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
    }
  }

  /**
   * Start watching location (for continuous tracking)
   */
  async startWatching(
    onLocationUpdate: (location: LocationCoordinates) => void,
    options?: LocationWatchOptions
  ): Promise<void> {
    try {
      if (this.watchId) {
        console.warn('Already watching location');
        return;
      }

      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 1000,
        },
        (position, err) => {
          if (err) {
            console.error('Geolocation watch error:', err);
            return;
          }

          if (position) {
            onLocationUpdate({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || undefined,
              altitude: position.coords.altitude || undefined,
              altitudeAccuracy:
                position.coords.altitudeAccuracy || undefined,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
              timestamp: position.timestamp,
            });
          }
        }
      );
    } catch (error) {
      console.error('Failed to start watching location:', error);
      throw error;
    }
  }

  /**
   * Stop watching location
   */
  async stopWatching(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  /**
   * Check if location is within a certain radius
   */
  isLocationWithinRadius(
    userLat: number,
    userLon: number,
    centerLat: number,
    centerLon: number,
    radiusInKm: number
  ): boolean {
    const distance = this.calculateDistance(
      userLat,
      userLon,
      centerLat,
      centerLon
    );
    return distance <= radiusInKm;
  }
}

export const geolocation = GeolocationService.getInstance();
