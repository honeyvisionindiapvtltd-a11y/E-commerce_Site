/**
 * Delivery State Machine
 * Centralized order status transition validation
 * Ensures all status changes follow valid lifecycle
 */

import Order from '../models/Order.js';

/**
 * Valid delivery status transitions
 * Maps current status to allowed next statuses
 */
const VALID_TRANSITIONS = {
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
  'CANCELLED': [],
};

/**
 * Delivery status categories for easy grouping
 */
export const STATUS_CATEGORIES = {
  PENDING: ['UNASSIGNED', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP'],
  IN_DELIVERY: ['OUT_FOR_DELIVERY', 'NEARBY', 'ARRIVED'],
  COMPLETED: ['DELIVERED'],
  FAILED: ['FAILED_DELIVERY', 'RESCHEDULED'],
  CANCELLED: ['CANCELLED'],
};

/**
 * Validate if a status transition is allowed
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  if (!VALID_TRANSITIONS[currentStatus]) {
    return false;
  }

  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
};

/**
 * Get allowed next statuses for current status
 */
export const getValidNextStatuses = (currentStatus) => {
  return VALID_TRANSITIONS[currentStatus] || [];
};

/**
 * Check if a status is in a category
 */
export const isStatusInCategory = (status, category) => {
  return STATUS_CATEGORIES[category]?.includes(status) || false;
};

/**
 * Validate and execute a status transition with business logic checks
 */
export const validateAndTransition = async (order, newStatus, metadata = {}) => {
  if (!order) {
    throw new Error('Order is required');
  }

  const currentStatus = order.status;

  if (currentStatus === newStatus) {
    throw new Error(`Order is already in ${newStatus} status`);
  }

  // Check if transition is valid
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Allowed transitions: ${getValidNextStatuses(currentStatus).join(', ')}`
    );
  }

  // Additional business logic checks based on transition
  switch (`${currentStatus}->${newStatus}`) {
    case 'ASSIGNED->UNASSIGNED':
    case 'ACCEPTED->UNASSIGNED':
      // Clear delivery agent
      order.deliveryAgent = null;
      order.deliveryAssignedAt = null;
      break;

    case 'ASSIGNED->ACCEPTED':
      // Delivery agent accepted the order
      order.deliveryStartedAt = new Date();
      break;

    case 'PICKED_UP->OUT_FOR_DELIVERY':
      // Started delivery
      order.deliveryStartedAt = new Date();
      break;

    case 'OUT_FOR_DELIVERY->NEARBY':
      // Agent is nearby
      if (!order.nearbyAt) {
        order.nearbyAt = new Date();
      }
      break;

    case 'OUT_FOR_DELIVERY->ARRIVED':
    case 'NEARBY->ARRIVED':
      // Agent arrived at delivery location
      if (!order.arrivedAt) {
        order.arrivedAt = new Date();
      }
      break;

    case 'ARRIVED->OTP_VERIFIED':
      // OTP verified
      order.deliveryOtpVerifiedAt = new Date();
      break;

    case 'OTP_VERIFIED->DELIVERED':
      // Delivery completed
      order.status = newStatus;
      order.deliveryProof = {
        ...order.deliveryProof,
        capturedAt: new Date(),
        capturedBy: metadata.capturedBy || null,
        notes: metadata.notes || '',
      };
      order.deliveryLocation = null; // Clear active GPS after delivery
      return order; // Return early to avoid overwriting below

    case 'OUT_FOR_DELIVERY->FAILED_DELIVERY':
    case 'NEARBY->FAILED_DELIVERY':
    case 'ARRIVED->FAILED_DELIVERY':
      // Delivery failed
      order.failedDeliveryAt = new Date();
      order.failedDeliveryReason = metadata.reason || null;
      order.failedDeliveryNotes = metadata.notes || '';
      order.deliveryLocation = null; // Clear active GPS after failure
      break;

    case 'FAILED_DELIVERY->RESCHEDULED':
      // Rescheduled for redelivery
      order.deliveryAgent = null;
      order.deliveryAssignedAt = null;
      order.deliveryStartedAt = null;
      break;
  }

  // Update status
  order.status = newStatus;

  // Add tracking event
  if (!order.trackingEvents) {
    order.trackingEvents = [];
  }

  const event = {
    status: newStatus,
    title: getStatusTransitionTitle(currentStatus, newStatus),
    description: getStatusTransitionDescription(currentStatus, newStatus),
    timestamp: new Date(),
    source: metadata.source || 'SYSTEM',
    completed: !isStatusInCategory(newStatus, 'PENDING'),
  };

  order.trackingEvents.push(event);

  return order;
};

/**
 * Get human-readable title for a status transition
 */
export const getStatusTransitionTitle = (fromStatus, toStatus) => {
  const titles = {
    'UNASSIGNED->ASSIGNED': 'Order Assigned',
    'ASSIGNED->ACCEPTED': 'Agent Accepted',
    'ACCEPTED->PICKED_UP': 'Order Picked Up',
    'PICKED_UP->OUT_FOR_DELIVERY': 'Out for Delivery',
    'OUT_FOR_DELIVERY->NEARBY': 'Agent Nearby',
    'NEARBY->ARRIVED': 'Agent Arrived',
    'ARRIVED->OTP_VERIFIED': 'OTP Verified',
    'OTP_VERIFIED->DELIVERED': 'Delivery Complete',
    'OUT_FOR_DELIVERY->FAILED_DELIVERY': 'Delivery Failed',
    'FAILED_DELIVERY->RESCHEDULED': 'Scheduled for Redelivery',
    'RESCHEDULED->ASSIGNED': 'Reassigned',
  };

  return titles[`${fromStatus}->${toStatus}`] || `Status changed to ${toStatus}`;
};

/**
 * Get human-readable description for a status transition
 */
export const getStatusTransitionDescription = (fromStatus, toStatus) => {
  const descriptions = {
    'UNASSIGNED->ASSIGNED': 'Delivery agent has been assigned to this order',
    'ASSIGNED->ACCEPTED': 'Delivery agent has accepted this order',
    'ACCEPTED->PICKED_UP': 'Order has been picked up from warehouse',
    'PICKED_UP->OUT_FOR_DELIVERY': 'Order is now out for delivery',
    'OUT_FOR_DELIVERY->NEARBY': 'Delivery agent is in the nearby area',
    'NEARBY->ARRIVED': 'Delivery agent has arrived at delivery location',
    'ARRIVED->OTP_VERIFIED': 'OTP has been verified',
    'OTP_VERIFIED->DELIVERED': 'Order has been delivered successfully',
    'OUT_FOR_DELIVERY->FAILED_DELIVERY': 'Delivery failed, will be rescheduled',
    'FAILED_DELIVERY->RESCHEDULED': 'Order has been scheduled for redelivery',
    'RESCHEDULED->ASSIGNED': 'Delivery agent has been assigned for redelivery',
  };

  return descriptions[`${fromStatus}->${toStatus}`] || `Status updated to ${toStatus}`;
};

/**
 * Check if an order is in a completed state
 */
export const isOrderCompleted = (order) => {
  return isStatusInCategory(order.status, 'COMPLETED');
};

/**
 * Check if an order is in an active delivery state
 */
export const isOrderInDelivery = (order) => {
  return isStatusInCategory(order.status, 'IN_DELIVERY');
};

/**
 * Check if an order can be cancelled
 */
export const canOrderBeCancelled = (order) => {
  const nonCancellableStatuses = ['OUT_FOR_DELIVERY', 'NEARBY', 'ARRIVED', 'DELIVERED'];
  return !nonCancellableStatuses.includes(order.status);
};

export default {
  VALID_TRANSITIONS,
  STATUS_CATEGORIES,
  isValidStatusTransition,
  getValidNextStatuses,
  isStatusInCategory,
  validateAndTransition,
  getStatusTransitionTitle,
  getStatusTransitionDescription,
  isOrderCompleted,
  isOrderInDelivery,
  canOrderBeCancelled,
};
