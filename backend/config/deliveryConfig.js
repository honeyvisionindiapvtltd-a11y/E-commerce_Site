/**
 * Delivery System Configuration Constants
 * All thresholds and parameters for the real-time delivery system
 */

export const DELIVERY_CONFIG = {
  // GPS Tracking Configuration
  GPS: {
    // Minimum time between GPS updates (milliseconds)
    MIN_UPDATE_INTERVAL_MS: parseInt(process.env.GPS_MIN_INTERVAL_MS || '5000', 10),

    // Minimum distance to trigger location update (meters)
    MIN_DISTANCE_METERS: parseInt(process.env.GPS_MIN_DISTANCE || '50', 10),

    // Maximum accuracy threshold (meters) - ignore updates with worse accuracy
    MAX_ACCURACY_THRESHOLD_METERS: parseInt(process.env.GPS_MAX_ACCURACY || '100', 10),

    // Maximum allowed speed (km/h) - detect impossible GPS jumps
    MAX_SPEED_KMH: parseInt(process.env.GPS_MAX_SPEED || '120', 10),

    // Maximum time between updates before marking stale (milliseconds)
    STALE_THRESHOLD_MS: parseInt(process.env.GPS_STALE_THRESHOLD_MS || '90000', 10), // 90 seconds

    // Browser geo location options
    GEOLOCATION_OPTIONS: {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    },
  },

  // Location Freshness Status
  LOCATION_STATUS: {
    LIVE: 'LIVE',          // Updated within 30 seconds
    DELAYED: 'DELAYED',    // Updated 30-90 seconds ago
    STALE: 'STALE',        // Updated 90+ seconds ago
    OFFLINE: 'OFFLINE',    // No update in 5+ minutes
  },

  // Location freshness thresholds (milliseconds)
  LOCATION_FRESHNESS_THRESHOLDS: {
    LIVE_MAX_MS: 30000,      // 30 seconds
    DELAYED_MAX_MS: 90000,   // 90 seconds
    STALE_MAX_MS: 300000,    // 5 minutes
  },

  // Geofencing Zones (meters from customer location)
  GEOFENCING: {
    APPROACHING_ZONE_METERS: parseInt(process.env.APPROACHING_ZONE || '2000', 10),   // 2 km
    NEARBY_ZONE_METERS: parseInt(process.env.NEARBY_ZONE || '500', 10),              // 500 m
    ARRIVED_ZONE_METERS: parseInt(process.env.ARRIVED_ZONE || '100', 10),            // 100 m
  },

  // ETA Calculation
  ETA: {
    // Throttle ETA recalculation (milliseconds)
    RECALC_THROTTLE_MS: parseInt(process.env.ETA_THROTTLE_MS || '30000', 10),

    // Minimum distance change to trigger ETA recalculation (meters)
    MIN_DISTANCE_CHANGE_METERS: 500,

    // Default average speed if routing provider unavailable (km/h)
    DEFAULT_AVERAGE_SPEED_KMH: 40,
  },

  // Agent Presence
  PRESENCE: {
    // Grace period before marking agent offline after disconnect (milliseconds)
    OFFLINE_GRACE_PERIOD_MS: parseInt(process.env.OFFLINE_GRACE_PERIOD_MS || '30000', 10),

    // Heartbeat interval (milliseconds)
    HEARTBEAT_INTERVAL_MS: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000', 10),

    // Mark agent offline if no heartbeat for this duration (milliseconds)
    HEARTBEAT_TIMEOUT_MS: parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '120000', 10),
  },

  // Delivery OTP
  OTP: {
    // OTP expiry time (milliseconds)
    EXPIRY_MS: parseInt(process.env.DELIVERY_OTP_EXPIRY_MS || '900000', 10), // 15 minutes

    // Maximum OTP verification attempts
    MAX_ATTEMPTS: 3,

    // Lockout duration after max attempts exceeded (milliseconds)
    LOCKOUT_MS: parseInt(process.env.DELIVERY_OTP_LOCKOUT_MS || '300000', 10), // 5 minutes

    // Resend throttle (milliseconds)
    RESEND_THROTTLE_MS: parseInt(process.env.DELIVERY_OTP_RESEND_THROTTLE_MS || '60000', 10), // 60 seconds
  },

  // Delivery Status Transitions
  STATUS_TRANSITIONS: {
    UNASSIGNED: 'UNASSIGNED',
    ASSIGNED: 'ASSIGNED',
    ACCEPTED: 'ACCEPTED',
    PICKED_UP: 'PICKED_UP',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    NEARBY: 'NEARBY',
    ARRIVED: 'ARRIVED',
    OTP_VERIFIED: 'OTP_VERIFIED',
    DELIVERED: 'DELIVERED',
    FAILED_DELIVERY: 'FAILED_DELIVERY',
    RESCHEDULED: 'RESCHEDULED',
  },

  // Valid delivery status transitions
  VALID_TRANSITIONS: {
    'UNASSIGNED': ['ASSIGNED', 'CANCELLED'],
    'ASSIGNED': ['ACCEPTED', 'UNASSIGNED'],
    'ACCEPTED': ['PICKED_UP', 'UNASSIGNED'],
    'PICKED_UP': ['OUT_FOR_DELIVERY'],
    'OUT_FOR_DELIVERY': ['NEARBY', 'ARRIVED', 'FAILED_DELIVERY'],
    'NEARBY': ['ARRIVED', 'FAILED_DELIVERY'],
    'ARRIVED': ['OTP_VERIFIED', 'FAILED_DELIVERY'],
    'OTP_VERIFIED': ['DELIVERED'],
    'DELIVERED': ['CANCELLED'],
    'FAILED_DELIVERY': ['RESCHEDULED', 'UNASSIGNED'],
    'RESCHEDULED': ['ASSIGNED'],
  },

  // Socket.IO Configuration
  SOCKET_IO: {
    // Room naming conventions
    ROOM_AGENT: (agentId) => `agent:${agentId}`,
    ROOM_ORDER: (orderNumber) => `order:${orderNumber}`,
    ROOM_USER: (userId) => `user:${userId}`,
    ROOM_ADMINS: 'admins',

    // Event names
    EVENTS: {
      // Agent events
      AGENT_LOCATION_UPDATE: 'delivery:agentLocationUpdate',
      AGENT_ONLINE: 'delivery:agentOnline',
      AGENT_OFFLINE: 'delivery:agentOffline',
      AGENT_HEARTBEAT: 'delivery:agentHeartbeat',

      // Order assignment events
      ORDER_ASSIGNED: 'delivery:orderAssigned',
      ASSIGNMENT_ACCEPTED: 'delivery:assignmentAccepted',

      // Delivery location events
      DELIVERY_LOCATION_UPDATE: 'delivery:locationUpdate',
      DELIVERY_LOCATION_STALE: 'delivery:locationStale',

      // Delivery progress events
      DELIVERY_STARTED: 'delivery:started',
      DELIVERY_APPROACHING: 'delivery:approaching',
      DELIVERY_NEARBY: 'delivery:nearby',
      DELIVERY_ARRIVED: 'delivery:arrived',
      DELIVERY_FAILED: 'delivery:failed',
      DELIVERY_COMPLETED: 'delivery:completed',

      // ETA events
      ETA_UPDATED: 'delivery:etaUpdated',

      // Status events
      ORDER_STATUS_UPDATE: 'delivery:statusUpdate',
    },
  },

  // Location History Storage
  LOCATION_HISTORY: {
    // Whether to store every GPS point or throttle
    STORE_EVERY_POINT: false,

    // Minimum distance between stored points (meters)
    MIN_STORAGE_DISTANCE_METERS: parseInt(process.env.LOCATION_HISTORY_MIN_DISTANCE || '100', 10),

    // Maximum historical points to query at once
    MAX_QUERY_RESULTS: 1000,
  },

  // Performance & Throttling
  PERFORMANCE: {
    // Maximum GPS updates to broadcast per second per order
    MAX_UPDATES_PER_SECOND: 2,

    // Batch location updates in Socket.IO (milliseconds)
    BATCH_INTERVAL_MS: 1000,

    // Maximum concurrent delivery tracking per agent
    MAX_CONCURRENT_DELIVERIES: 20,
  },
};

export default DELIVERY_CONFIG;
