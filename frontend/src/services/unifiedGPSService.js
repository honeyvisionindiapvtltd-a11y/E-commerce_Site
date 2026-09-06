/**
 * Unified GPS Service for Delivery Agent
 * Manages a single GPS watcher for the entire agent session
 * Broadcasts position updates to all active deliveries
 * 
 * IMPORTANT: There should be only ONE GPS watcher per agent session
 * All active orders receive updates from this single watcher
 */

import { DELIVERY_CONFIG } from '../config/deliveryConfig';

class UnifiedGPSService {
  constructor() {
    this.watchId = null;
    this.isWatching = false;
    this.lastLocation = null;
    this.lastUpdateTime = 0;
    this.subscribers = new Map(); // orderId -> callback function
    this.errorCallbacks = [];
    this.permissionDenied = false;
    this.lastValidatedLocation = null;
  }

  /**
   * Start GPS watching for the delivery agent
   * This runs ONCE per session - not per order
   */
  startWatching(onError = null) {
    if (this.isWatching) {
      console.warn('GPS already being watched');
      return;
    }

    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      console.error(error);
      if (onError) onError({ message: error, code: 'GEOLOCATION_NOT_AVAILABLE' });
      return;
    }

    if (this.permissionDenied) {
      const error = 'Location permission has been denied';
      if (onError) onError({ message: error, code: 'PERMISSION_DENIED' });
      return;
    }

    this.isWatching = true;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.onPositionUpdate(position),
      (error) => this.onPositionError(error, onError),
      DELIVERY_CONFIG.GPS.GEOLOCATION_OPTIONS
    );

    console.debug('GPS watching started');
  }

  /**
   * Handle GPS position update
   * Apply throttling and broadcast to all subscribers
   */
  onPositionUpdate(position) {
    try {
      const coords = position.coords;
      const currentTime = Date.now();

      const location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading || null,
        speed: coords.speed || null,
        timestamp: new Date(),
      };

      // Validate coordinates
      if (!this.isValidLocation(location)) {
        console.warn('Invalid GPS location rejected:', location);
        return;
      }

      // Apply throttling based on time and distance
      if (!this.shouldUpdateLocation(location, currentTime)) {
        return;
      }

      // Update last location
      this.lastLocation = location;
      this.lastUpdateTime = currentTime;

      if (import.meta.env.DEV) {
        console.debug('GPS Update:', {
          lat: location.latitude.toFixed(4),
          lon: location.longitude.toFixed(4),
          accuracy: location.accuracy?.toFixed(1),
          subscribers: this.subscribers.size,
        });
      }

      // Broadcast to all subscribers (orders)
      this.broadcastUpdate(location);
    } catch (error) {
      console.error('Error processing GPS update:', error);
    }
  }

  /**
   * Validate GPS coordinates
   */
  isValidLocation(location) {
    const { latitude, longitude } = location;

    // Check if valid numbers
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return false;
    }

    // Check bounds
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;

    // Reject null island (0,0)
    if (latitude === 0 && longitude === 0) return false;

    return true;
  }

  /**
   * Check if location update should be sent
   * Apply throttling based on time and distance
   */
  shouldUpdateLocation(location, currentTime) {
    if (!this.lastLocation) {
      return true; // First update
    }

    const timeDelta = currentTime - this.lastUpdateTime;
    const minInterval = DELIVERY_CONFIG.GPS.MIN_UPDATE_INTERVAL_MS;

    if (timeDelta < minInterval) {
      return false; // Too soon
    }

    const distance = this.calculateDistance(this.lastLocation, location);
    const minDistance = DELIVERY_CONFIG.GPS.MIN_DISTANCE_METERS;

    if (distance < minDistance) {
      return false; // Too close
    }

    return true;
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  calculateDistance(point1, point2) {
    const EARTH_RADIUS = 6371000; // meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const lat1 = toRad(point1.latitude);
    const lon1 = toRad(point1.longitude);
    const lat2 = toRad(point2.latitude);
    const lon2 = toRad(point2.longitude);

    const latDelta = lat2 - lat1;
    const lonDelta = lon2 - lon1;

    const a =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) ** 2;

    return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Handle GPS position error
   */
  onPositionError(error, onError) {
    let errorData = {
      code: error.code,
      message: error.message,
    };

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorData.type = 'permission_denied';
        this.permissionDenied = true;
        this.stopWatching();
        break;
      case error.POSITION_UNAVAILABLE:
        errorData.type = 'position_unavailable';
        break;
      case error.TIMEOUT:
        errorData.type = 'timeout';
        break;
      default:
        errorData.type = 'unknown';
    }

    console.error('GPS Error:', errorData);

    if (onError) {
      onError(errorData);
    }

    // Notify all subscribers
    this.errorCallbacks.forEach((cb) => cb(errorData));
  }

  /**
   * Broadcast location update to all subscribed orders
   */
  broadcastUpdate(location) {
    if (this.subscribers.size === 0) return;

    const updateData = {
      ...location,
      timestamp: location.timestamp.toISOString(),
    };

    this.subscribers.forEach((callback) => {
      try {
        callback(updateData);
      } catch (error) {
        console.error('Error in GPS subscriber callback:', error);
      }
    });
  }

  /**
   * Subscribe to GPS updates for a specific order
   */
  subscribe(orderId, callback) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.subscribers.set(orderId, callback);

    // Send last known location immediately if available
    if (this.lastLocation) {
      callback({
        ...this.lastLocation,
        timestamp: this.lastLocation.timestamp.toISOString(),
      });
    }

    // Start watching if not already
    if (!this.isWatching && !this.permissionDenied) {
      this.startWatching();
    }

    return () => this.unsubscribe(orderId);
  }

  /**
   * Unsubscribe from GPS updates
   */
  unsubscribe(orderId) {
    this.subscribers.delete(orderId);

    // Stop watching if no more subscribers
    if (this.subscribers.size === 0) {
      this.stopWatching();
    }
  }

  /**
   * Stop GPS watching
   */
  stopWatching() {
    if (!this.isWatching) return;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isWatching = false;
    console.debug('GPS watching stopped');
  }

  /**
   * Get current location
   */
  getCurrentLocation() {
    return this.lastLocation
      ? {
          ...this.lastLocation,
          timestamp: this.lastLocation.timestamp.toISOString(),
        }
      : null;
  }

  /**
   * Register error callback
   */
  onError(callback) {
    if (typeof callback === 'function') {
      this.errorCallbacks.push(callback);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.stopWatching();
    this.subscribers.clear();
    this.errorCallbacks = [];
    this.lastLocation = null;
  }
}

// Create singleton instance
export const unifiedGPSService = new UnifiedGPSService();

export default unifiedGPSService;
