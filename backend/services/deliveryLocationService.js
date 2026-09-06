/**
 * Delivery Location Service
 * Handles GPS tracking, validation, history, and location updates
 * - Single source of truth for delivery agent location
 * - Validates GPS data and detects impossible jumps
 * - Stores location history for route analysis
 * - Manages geofencing and location freshness
 */

import DeliveryLocationHistory from '../models/DeliveryLocationHistory.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { DELIVERY_CONFIG } from '../config/deliveryConfig.js';
import { recordLocationUpdate, recordDeliveryMilestone } from './deliveryEventService.js';

/**
 * Validate GPS coordinates
 */
export const validateCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  // Check if valid numbers
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { valid: false, reason: 'INVALID_COORDINATES', message: 'Coordinates must be valid numbers' };
  }

  // Check bounds
  if (lat < -90 || lat > 90) {
    return { valid: false, reason: 'INVALID_COORDINATES', message: 'Latitude must be between -90 and 90' };
  }

  if (lon < -180 || lon > 180) {
    return { valid: false, reason: 'INVALID_COORDINATES', message: 'Longitude must be between -180 and 180' };
  }

  // Reject zero coordinates (null island)
  if (lat === 0 && lon === 0) {
    return { valid: false, reason: 'INVALID_COORDINATES', message: 'Zero coordinates are not valid' };
  }

  return { valid: true };
};

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (point1, point2) => {
  const EARTH_RADIUS_METERS = 6371000;
  const toRadians = (degrees) => degrees * Math.PI / 180;

  const lat1 = toRadians(point1.latitude || point1.lat || point1.coords?.latitude);
  const lon1 = toRadians(point1.longitude || point1.lon || point1.coords?.longitude);
  const lat2 = toRadians(point2.latitude || point2.lat || point2.coords?.latitude);
  const lon2 = toRadians(point2.longitude || point2.lon || point2.coords?.longitude);

  const latDelta = lat2 - lat1;
  const lonDelta = lon2 - lon1;

  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) ** 2;

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Detect if a GPS jump is physically impossible
 */
export const detectGPSJump = (previousLocation, newLocation, timeDeltaSeconds) => {
  if (!previousLocation) {
    return { isJump: false };
  }

  const distanceMeters = calculateDistance(previousLocation, newLocation);
  const timeSeconds = Math.max(timeDeltaSeconds || 1, 1); // Avoid division by zero
  const calculatedSpeedMps = distanceMeters / timeSeconds;
  const calculatedSpeedKmh = calculatedSpeedMps * 3.6;

  const maxAllowedSpeedKmh = DELIVERY_CONFIG.GPS.MAX_SPEED_KMH;

  if (calculatedSpeedKmh > maxAllowedSpeedKmh) {
    return {
      isJump: true,
      distance: distanceMeters,
      timeSeconds,
      calculatedSpeedKmh,
      maxAllowedSpeedKmh,
      reason: 'IMPOSSIBLE_SPEED',
    };
  }

  return { isJump: false, calculatedSpeedKmh };
};

/**
 * Validate GPS update payload
 */
export const validateGPSUpdate = (payload, previousLocation = null, previousTimestamp = null) => {
  const errors = [];

  // Validate coordinates
  const coordValidation = validateCoordinates(payload.latitude, payload.longitude);
  if (!coordValidation.valid) {
    errors.push({
      field: 'coordinates',
      reason: coordValidation.reason,
      message: coordValidation.message,
    });
  }

  // Validate accuracy if provided
  if (payload.accuracy !== null && payload.accuracy !== undefined) {
    const accuracy = Number(payload.accuracy);
    if (!Number.isFinite(accuracy) || accuracy < 0) {
      errors.push({
        field: 'accuracy',
        reason: 'INVALID_ACCURACY',
        message: 'Accuracy must be a non-negative number',
      });
    }
    // Reject very poor accuracy
    if (accuracy > DELIVERY_CONFIG.GPS.MAX_ACCURACY_THRESHOLD_METERS) {
      errors.push({
        field: 'accuracy',
        reason: 'POOR_ACCURACY',
        message: `GPS accuracy is too poor (${Math.round(accuracy)}m > ${DELIVERY_CONFIG.GPS.MAX_ACCURACY_THRESHOLD_METERS}m)`,
      });
    }
  }

  // Validate heading if provided
  if (payload.heading !== null && payload.heading !== undefined) {
    const heading = Number(payload.heading);
    if (!Number.isFinite(heading) || heading < 0 || heading > 360) {
      errors.push({
        field: 'heading',
        reason: 'INVALID_HEADING',
        message: 'Heading must be between 0 and 360',
      });
    }
  }

  // Validate speed if provided
  if (payload.speed !== null && payload.speed !== undefined) {
    const speed = Number(payload.speed);
    if (!Number.isFinite(speed) || speed < 0) {
      errors.push({
        field: 'speed',
        reason: 'INVALID_SPEED',
        message: 'Speed must be a non-negative number',
      });
    }
  }

  // Detect GPS jumps if previous location exists
  if (previousLocation && previousTimestamp) {
    const currentTimestamp = new Date(payload.timestamp || new Date()).getTime();
    const previousTs = new Date(previousTimestamp).getTime();
    const timeDeltaSeconds = Math.max((currentTimestamp - previousTs) / 1000, 1);

    const jumpDetection = detectGPSJump(previousLocation, payload, timeDeltaSeconds);
    if (jumpDetection.isJump) {
      errors.push({
        field: 'location_jump',
        reason: 'GPS_JUMP_DETECTED',
        message: `Impossible GPS jump detected: ${jumpDetection.calculatedSpeedKmh.toFixed(1)} km/h > ${jumpDetection.maxAllowedSpeedKmh} km/h`,
        details: jumpDetection,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Update delivery agent's current location in GeoJSON format
 * This is the single source of truth for agent location
 */
export const updateAgentCurrentLocation = async (agentId, location) => {
  try {
    const agent = await User.findById(agentId);
    if (!agent) {
      throw new Error('Delivery agent not found');
    }

    // Update agent current location in GeoJSON format
    agent.currentLocation = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
      accuracy: location.accuracy || null,
      heading: location.heading || null,
      speed: location.speed || null,
      updatedAt: new Date(),
    };

    // Add legacy lat/lon for backward compatibility
    agent.latitude = location.latitude;
    agent.longitude = location.longitude;
    agent.lastLocationUpdate = new Date();
    agent.isOnline = true;
    agent.lastSeenAt = new Date();

    await agent.save();

    return agent;
  } catch (error) {
    console.error('Failed to update agent current location:', error);
    throw error;
  }
};

/**
 * Store location history point
 */
export const storeLocationHistory = async (
  agentId,
  orderId,
  location,
  metadata = {}
) => {
  try {
    // Check if we should store this point based on throttling config
    if (DELIVERY_CONFIG.LOCATION_HISTORY.STORE_EVERY_POINT === false) {
      const lastPoint = await DeliveryLocationHistory.findOne({ agentId, orderId })
        .sort({ createdAt: -1 })
        .lean();

      if (lastPoint) {
        const distance = calculateDistance(lastPoint.location.coordinates.reverse(), location);
        if (distance < DELIVERY_CONFIG.LOCATION_HISTORY.MIN_STORAGE_DISTANCE_METERS) {
          return null; // Skip storage
        }
      }
    }

    const history = new DeliveryLocationHistory({
      agentId,
      orderId,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
      accuracy: location.accuracy || null,
      heading: location.heading || null,
      speed: location.speed || null,
      timestamp: new Date(location.timestamp || new Date()),
      isValid: metadata.isValid !== false,
      validationFailure: metadata.validationFailure || null,
      distanceFromPrevious: metadata.distanceFromPrevious || null,
      timeSincePrevious: metadata.timeSincePrevious || null,
      calculatedSpeed: metadata.calculatedSpeed || null,
    });

    await history.save();
    return history;
  } catch (error) {
    console.error('Failed to store location history:', error);
    throw error;
  }
};

/**
 * Get location freshness status
 */
export const getLocationFreshnessStatus = (lastLocationTimestamp) => {
  if (!lastLocationTimestamp) {
    return DELIVERY_CONFIG.LOCATION_STATUS.OFFLINE;
  }

  const ageMs = Date.now() - new Date(lastLocationTimestamp).getTime();

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
export const getLocationAge = (lastLocationTimestamp) => {
  if (!lastLocationTimestamp) {
    return null;
  }

  return Date.now() - new Date(lastLocationTimestamp).getTime();
};

/**
 * Check geofencing milestones
 * Returns which milestone(s) the delivery agent has reached
 */
export const checkGeofencingMilestones = (agentLocation, customerLocation, previousDistance = null) => {
  const distance = calculateDistance(agentLocation, customerLocation);
  const milestones = [];

  if (distance <= DELIVERY_CONFIG.GEOFENCING.ARRIVED_ZONE_METERS && (!previousDistance || previousDistance > DELIVERY_CONFIG.GEOFENCING.ARRIVED_ZONE_METERS)) {
    milestones.push({ type: 'arrived', distance });
  }

  if (distance <= DELIVERY_CONFIG.GEOFENCING.NEARBY_ZONE_METERS && (!previousDistance || previousDistance > DELIVERY_CONFIG.GEOFENCING.NEARBY_ZONE_METERS)) {
    milestones.push({ type: 'nearby', distance });
  }

  if (distance <= DELIVERY_CONFIG.GEOFENCING.APPROACHING_ZONE_METERS && (!previousDistance || previousDistance > DELIVERY_CONFIG.GEOFENCING.APPROACHING_ZONE_METERS)) {
    milestones.push({ type: 'approaching', distance });
  }

  return { milestones, currentDistance: distance };
};

/**
 * Process location update with full validation and history
 */
export const processLocationUpdate = async (
  agentId,
  orderId,
  orderNumber,
  location,
  orderShippingAddress = null
) => {
  try {
    // Validate the GPS data
    const order = await Order.findById(orderId).select('deliveryLocation shippingAddress').lean();
    const previousLocation = order?.deliveryLocation;
    const previousTimestamp = order?.deliveryLocation?.updatedAt;

    const validation = validateGPSUpdate(location, previousLocation, previousTimestamp);

    if (!validation.valid) {
      console.warn('GPS update validation failed:', {
        orderNumber,
        errors: validation.errors,
      });
      return {
        success: false,
        validation,
      };
    }

    // Update agent's current location
    await updateAgentCurrentLocation(agentId, location);

    // Store in history
    const history = await storeLocationHistory(agentId, orderId, location, {
      isValid: true,
    });

    // Record event
    await recordLocationUpdate(orderId, orderNumber, agentId, location);

    // Check geofencing milestones
    let milestoneData = null;
    if (orderShippingAddress) {
      const customerLocation = {
        latitude: orderShippingAddress.latitude,
        longitude: orderShippingAddress.longitude,
      };

      if (customerLocation.latitude && customerLocation.longitude) {
        const geofenceCheck = checkGeofencingMilestones(
          location,
          customerLocation,
          previousLocation ? calculateDistance(previousLocation, customerLocation) : null
        );

        // Record milestone events
        for (const milestone of geofenceCheck.milestones) {
          await recordDeliveryMilestone(
            orderId,
            orderNumber,
            agentId,
            milestone.type,
            location,
            geofenceCheck.currentDistance,
            null // ETA to be calculated separately
          );
        }

        milestoneData = geofenceCheck;
      }
    }

    return {
      success: true,
      location,
      history,
      milestones: milestoneData,
    };
  } catch (error) {
    console.error('Failed to process location update:', error);
    throw error;
  }
};

/**
 * Get location history for a delivery
 */
export const getLocationHistory = async (orderId, agentId = null, limit = 100) => {
  try {
    const query = { orderId };
    if (agentId) {
      query.agentId = agentId;
    }

    const history = await DeliveryLocationHistory.find(query)
      .select('-__v')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return history;
  } catch (error) {
    console.error('Failed to get location history:', error);
    throw error;
  }
};

export default {
  validateCoordinates,
  calculateDistance,
  detectGPSJump,
  validateGPSUpdate,
  updateAgentCurrentLocation,
  storeLocationHistory,
  getLocationFreshnessStatus,
  getLocationAge,
  checkGeofencingMilestones,
  processLocationUpdate,
  getLocationHistory,
};
