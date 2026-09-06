/**
 * Frontend Delivery Configuration
 * Mirrors backend DELIVERY_CONFIG for consistency
 */

export const DELIVERY_CONFIG = {
  GPS: {
    MIN_UPDATE_INTERVAL_MS: 5000,      // 5 seconds
    MIN_DISTANCE_METERS: 50,           // 50 meters
    MAX_ACCURACY_THRESHOLD_METERS: 100, // 100 meters
    MAX_SPEED_KMH: 120,
    STALE_THRESHOLD_MS: 90000,         // 90 seconds
    GEOLOCATION_OPTIONS: {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    },
  },

  LOCATION_STATUS: {
    LIVE: 'LIVE',
    DELAYED: 'DELAYED',
    STALE: 'STALE',
    OFFLINE: 'OFFLINE',
  },

  LOCATION_FRESHNESS_THRESHOLDS: {
    LIVE_MAX_MS: 30000,      // 30 seconds
    DELAYED_MAX_MS: 90000,   // 90 seconds
    STALE_MAX_MS: 300000,    // 5 minutes
  },

  GEOFENCING: {
    APPROACHING_ZONE_METERS: 2000,  // 2 km
    NEARBY_ZONE_METERS: 500,        // 500 m
    ARRIVED_ZONE_METERS: 100,       // 100 m
  },

  ETA: {
    RECALC_THROTTLE_MS: 30000,
    MIN_DISTANCE_CHANGE_METERS: 500,
    DEFAULT_AVERAGE_SPEED_KMH: 40,
  },

  PRESENCE: {
    OFFLINE_GRACE_PERIOD_MS: 30000,
    HEARTBEAT_INTERVAL_MS: 30000,
    HEARTBEAT_TIMEOUT_MS: 120000,
  },

  OTP: {
    EXPIRY_MS: 900000,  // 15 minutes
    MAX_ATTEMPTS: 3,
    LOCKOUT_MS: 300000, // 5 minutes
    RESEND_THROTTLE_MS: 60000,
  },

  SOCKET_IO: {
    ROOM_AGENT: (agentId) => `agent:${agentId}`,
    ROOM_ORDER: (orderNumber) => `order:${orderNumber}`,
    ROOM_USER: (userId) => `user:${userId}`,
    ROOM_ADMINS: 'admins',

    EVENTS: {
      AGENT_LOCATION_UPDATE: 'delivery:agentLocationUpdate',
      AGENT_ONLINE: 'delivery:agentOnline',
      AGENT_OFFLINE: 'delivery:agentOffline',
      AGENT_HEARTBEAT: 'delivery:agentHeartbeat',

      ORDER_ASSIGNED: 'delivery:orderAssigned',
      ASSIGNMENT_ACCEPTED: 'delivery:assignmentAccepted',

      DELIVERY_LOCATION_UPDATE: 'delivery:locationUpdate',
      DELIVERY_LOCATION_STALE: 'delivery:locationStale',

      DELIVERY_STARTED: 'delivery:started',
      DELIVERY_APPROACHING: 'delivery:approaching',
      DELIVERY_NEARBY: 'delivery:nearby',
      DELIVERY_ARRIVED: 'delivery:arrived',
      DELIVERY_FAILED: 'delivery:failed',
      DELIVERY_COMPLETED: 'delivery:completed',

      ETA_UPDATED: 'delivery:etaUpdated',
      ORDER_STATUS_UPDATE: 'delivery:statusUpdate',
    },
  },
};

/**
 * Get location freshness status
 */
export const getLocationFreshnessStatus = (timestamp) => {
  if (!timestamp) {
    return DELIVERY_CONFIG.LOCATION_STATUS.OFFLINE;
  }

  const ageMs = Date.now() - new Date(timestamp).getTime();

  if (ageMs <= DELIVERY_CONFIG.LOCATION_FRESHNESS_THRESHOLDS.LIVE_MAX_MS) {
    return DELIVERY_CONFIG.LOCATION_STATUS.LIVE;
  }

  if (ageMs <= DELIVERY_CONFIG.LOCATION_FRESHNESS_THRESHOLDS.DELAYED_MAX_MS) {
    return DELIVERY_CONFIG.LOCATION_STATUS.DELAYED;
  }

  if (ageMs <= DELIVERY_CONFIG.LOCATION_FRESHNESS_THRESHOLDS.STALE_MAX_MS) {
    return DELIVERY_CONFIG.LOCATION_STATUS.STALE;
  }

  return DELIVERY_CONFIG.LOCATION_STATUS.OFFLINE;
};

/**
 * Get location age in milliseconds
 */
export const getLocationAge = (timestamp) => {
  if (!timestamp) return null;
  return Date.now() - new Date(timestamp).getTime();
};

export default DELIVERY_CONFIG;
