/**
 * Delivery Event Service
 * Centralized event creation and emission for delivery lifecycle
 * Supports event sequencing to prevent race conditions
 */

import DeliveryEvent from '../models/DeliveryEvent.js';
import Order from '../models/Order.js';
import { getIO } from '../services/realtimeService.js';
import { DELIVERY_CONFIG } from '../config/deliveryConfig.js';

// Track sequence numbers per order
const sequenceCounters = new Map();

/**
 * Get next sequence number for an order
 * Ensures monotonically increasing sequences
 */
const getNextSequence = async (orderId) => {
  const key = String(orderId);
  
  // Get the highest sequence from database
  const lastEvent = await DeliveryEvent.findOne({ orderId })
    .select('sequence')
    .sort({ sequence: -1 })
    .lean();

  const dbSequence = (lastEvent?.sequence || 0) + 1;
  const currentCounter = (sequenceCounters.get(key) || 0) + 1;

  const nextSequence = Math.max(dbSequence, currentCounter);
  sequenceCounters.set(key, nextSequence);

  return nextSequence;
};

/**
 * Create a delivery event and emit via Socket.IO
 * All delivery events flow through this function
 */
export const createDeliveryEvent = async (options = {}) => {
  try {
    const {
      orderId,
      orderNumber,
      agentId = null,
      customerId = null,
      eventType,
      previousStatus = null,
      currentStatus = null,
      location = null,
      estimatedDeliveryTime = null,
      distanceToDelivery = null,
      payload = null,
      notificationSent = false,
      adminNotes = null,
      source = 'SYSTEM',
    } = options;

    if (!orderId || !eventType) {
      throw new Error('orderId and eventType are required');
    }

    // Get next sequence number
    const sequence = await getNextSequence(orderId);

    // Create the event
    const event = new DeliveryEvent({
      orderId,
      orderNumber: orderNumber || String(orderId),
      agentId,
      customerId,
      sequence,
      eventType,
      previousStatus,
      currentStatus,
      location,
      estimatedDeliveryTime,
      distanceToDelivery,
      payload,
      notificationSent,
      adminNotes,
      source,
      eventTimestamp: new Date(),
    });

    await event.save();

    if (process.env.NODE_ENV !== 'production') {
      console.debug('Delivery event created:', {
        eventType,
        orderNumber: orderNumber || String(orderId),
        sequence,
        currentStatus,
      });
    }

    // Emit event via Socket.IO
    await emitDeliveryEvent(event);

    return event;
  } catch (error) {
    console.error('Failed to create delivery event:', error);
    throw error;
  }
};

/**
 * Emit delivery event via Socket.IO to relevant parties
 */
export const emitDeliveryEvent = async (event) => {
  try {
    const io = getIO();
    if (!io) return;

    const longitude = Array.isArray(event.location?.coordinates) ? Number(event.location.coordinates[0]) : Number(event.payload?.longitude ?? null);
    const latitude = Array.isArray(event.location?.coordinates) ? Number(event.location.coordinates[1]) : Number(event.payload?.latitude ?? null);

    const eventPayload = {
      eventId: event._id?.toString(),
      sequence: event.sequence,
      eventType: event.eventType,
      orderNumber: event.orderNumber,
      orderId: event.orderId?.toString(),
      agentId: event.agentId?.toString(),
      previousStatus: event.previousStatus,
      currentStatus: event.currentStatus,
      location: event.location,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      accuracy: event.payload?.accuracy ?? null,
      heading: event.payload?.heading ?? null,
      speed: event.payload?.speed ?? null,
      estimatedDeliveryTime: event.estimatedDeliveryTime,
      distanceToDelivery: event.distanceToDelivery,
      eventTimestamp: event.eventTimestamp,
      updatedAt: event.eventTimestamp,
      payload: event.payload,
    };

    // Emit to order room (customer + agent + admin)
    // For location events, use 'delivery:locationUpdate' for backward compatibility
    if (event.eventType === 'DELIVERY_LOCATION_UPDATED') {
      io.to(DELIVERY_CONFIG.SOCKET_IO.ROOM_ORDER(event.orderNumber))
        .emit(DELIVERY_CONFIG.SOCKET_IO.EVENTS.DELIVERY_LOCATION_UPDATE, eventPayload);
    } else {
      // For all other delivery events, use the generic status update event
      io.to(DELIVERY_CONFIG.SOCKET_IO.ROOM_ORDER(event.orderNumber))
        .emit('order:statusUpdate', eventPayload); // Backward compatible event name
    }

    // Emit to agent room if applicable
    if (event.agentId) {
      io.to(DELIVERY_CONFIG.SOCKET_IO.ROOM_AGENT(event.agentId.toString()))
        .emit(eventPayload.eventType, eventPayload);
    }

    // Emit to admin room for important events
    const adminRelevantEvents = [
      'DELIVERY_FAILED',
      'DELIVERY_COMPLETED',
      'ORDER_ASSIGNED',
      'AGENT_OFFLINE',
      'AGENT_ONLINE',
    ];

    if (adminRelevantEvents.includes(event.eventType)) {
      io.to(DELIVERY_CONFIG.SOCKET_IO.ROOM_ADMINS)
        .emit(eventPayload.eventType, eventPayload);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug('Delivery event emitted:', eventPayload.eventType);
    }
  } catch (error) {
    console.error('Failed to emit delivery event:', error);
  }
};

/**
 * Record delivery location update event
 */
export const recordLocationUpdate = async (orderId, orderNumber, agentId, location, metadata = {}) => {
  try {
    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      heading: location.heading,
      speed: location.speed,
      ...metadata,
    };

    return await createDeliveryEvent({
      orderId,
      orderNumber,
      agentId,
      eventType: 'DELIVERY_LOCATION_UPDATED',
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
      distanceToDelivery: metadata.distanceToDelivery || null,
      estimatedDeliveryTime: metadata.estimatedDeliveryTime || null,
      payload,
      source: 'SYSTEM',
    });
  } catch (error) {
    console.error('Failed to record location update event:', error);
    throw error;
  }
};

/**
 * Record status transition event
 */
export const recordStatusTransition = async (
  orderId,
  orderNumber,
  agentId,
  previousStatus,
  currentStatus,
  metadata = {}
) => {
  try {
    // Determine event type based on status
    const eventTypeMap = {
      'ASSIGNED': 'ORDER_ASSIGNED',
      'ACCEPTED': 'ASSIGNMENT_ACCEPTED',
      'OUT_FOR_DELIVERY': 'DELIVERY_STARTED',
      'NEARBY': 'DELIVERY_NEARBY',
      'ARRIVED': 'DELIVERY_ARRIVED',
      'DELIVERED': 'DELIVERY_COMPLETED',
      'FAILED_DELIVERY': 'DELIVERY_FAILED',
      'RESCHEDULED': 'DELIVERY_RESCHEDULED',
    };

    const eventType = eventTypeMap[currentStatus] || 'ORDER_STATUS_UPDATE';

    return await createDeliveryEvent({
      orderId,
      orderNumber,
      agentId,
      eventType,
      previousStatus,
      currentStatus,
      payload: metadata,
      source: 'SYSTEM',
    });
  } catch (error) {
    console.error('Failed to record status transition event:', error);
    throw error;
  }
};

/**
 * Record delivery milestone (approaching, nearby, arrived)
 */
export const recordDeliveryMilestone = async (
  orderId,
  orderNumber,
  agentId,
  milestoneType,
  location,
  distanceToDelivery,
  estimatedDeliveryTime
) => {
  try {
    const milestoneEventTypes = {
      'approaching': 'DELIVERY_APPROACHING',
      'nearby': 'DELIVERY_NEARBY',
      'arrived': 'DELIVERY_ARRIVED',
    };

    return await createDeliveryEvent({
      orderId,
      orderNumber,
      agentId,
      eventType: milestoneEventTypes[milestoneType] || 'DELIVERY_LOCATION_UPDATED',
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
      distanceToDelivery,
      estimatedDeliveryTime,
      payload: {
        milestone: milestoneType,
        triggeredAt: new Date(),
      },
      source: 'SYSTEM',
    });
  } catch (error) {
    console.error('Failed to record delivery milestone:', error);
    throw error;
  }
};

/**
 * Record agent online/offline status
 */
export const recordAgentPresence = async (agentId, isOnline) => {
  try {
    const eventType = isOnline ? 'AGENT_ONLINE' : 'AGENT_OFFLINE';

    return await createDeliveryEvent({
      orderId: null,
      orderNumber: null,
      agentId,
      eventType,
      payload: {
        isOnline,
        timestamp: new Date(),
      },
      source: 'SYSTEM',
    });
  } catch (error) {
    console.error('Failed to record agent presence:', error);
    // Don't throw - this shouldn't block other operations
  }
};

/**
 * Get delivery timeline for an order
 * Returns all events in sequence order
 */
export const getDeliveryTimeline = async (orderId, limit = 100) => {
  try {
    const events = await DeliveryEvent.find({ orderId })
      .select('-__v')
      .sort({ sequence: 1 })
      .limit(limit)
      .lean();

    return events;
  } catch (error) {
    console.error('Failed to get delivery timeline:', error);
    throw error;
  }
};

/**
 * Get events after a specific sequence number
 * Used by frontend to fetch only new events
 */
export const getEventsSinceSequence = async (orderId, lastSequence) => {
  try {
    const events = await DeliveryEvent.find({
      orderId,
      sequence: { $gt: lastSequence },
    })
      .select('-__v')
      .sort({ sequence: 1 })
      .lean();

    return events;
  } catch (error) {
    console.error('Failed to get events since sequence:', error);
    throw error;
  }
};

/**
 * Validate a status transition
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  const validTransitions = DELIVERY_CONFIG.STATUS_TRANSITIONS.VALID_TRANSITIONS;
  const allowedTargets = validTransitions[fromStatus] || [];
  return allowedTargets.includes(toStatus);
};

export default {
  createDeliveryEvent,
  emitDeliveryEvent,
  recordLocationUpdate,
  recordStatusTransition,
  recordDeliveryMilestone,
  recordAgentPresence,
  getDeliveryTimeline,
  getEventsSinceSequence,
  isValidStatusTransition,
};
