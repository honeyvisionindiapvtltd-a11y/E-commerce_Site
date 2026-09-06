import mongoose from 'mongoose';

/**
 * DeliveryEvent - Event audit trail for delivery lifecycle
 * Tracks important milestones and status changes
 * Supports event sequencing to prevent stale events from corrupting state
 */
const deliveryEventSchema = new mongoose.Schema(
  {
    // Order associated with this event
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    // Order number for reference
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },

    // Delivery agent involved
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Customer receiving delivery
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Monotonically increasing sequence number per order
    // Prevents stale Socket.IO events from overwriting newer state
    sequence: {
      type: Number,
      required: true,
      index: true,
    },

    // Event type from delivery lifecycle
    eventType: {
      type: String,
      required: true,
      enum: [
        'ORDER_ASSIGNED',
        'ASSIGNMENT_ACCEPTED',
        'DELIVERY_STARTED',
        'DELIVERY_LOCATION_UPDATED',
        'ETA_UPDATED',
        'DELIVERY_APPROACHING',
        'DELIVERY_NEARBY',
        'DELIVERY_ARRIVED',
        'OTP_VERIFIED',
        'DELIVERY_FAILED',
        'DELIVERY_RESCHEDULED',
        'DELIVERY_COMPLETED',
        'AGENT_ONLINE',
        'AGENT_OFFLINE',
        'AGENT_LOCATION_STALE',
        'DELIVERY_CANCELLED',
      ],
      index: true,
    },

    // Old order status (before transition)
    previousStatus: {
      type: String,
      default: null,
    },

    // New order status (after transition)
    currentStatus: {
      type: String,
      default: null,
      index: true,
    },

    // Location at time of event (GeoJSON Point)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: null,
      },
    },

    // Estimated time to arrival if applicable
    estimatedDeliveryTime: {
      type: Number, // milliseconds
      default: null,
    },

    // Distance to delivery address if applicable
    distanceToDelivery: {
      type: Number, // meters
      default: null,
    },

    // Event payload with additional data
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Whether this event triggered any notifications
    notificationSent: {
      type: Boolean,
      default: false,
    },

    // Admin notes or actions
    adminNotes: {
      type: String,
      default: null,
    },

    // Source of the event
    source: {
      type: String,
      enum: ['SYSTEM', 'AGENT', 'CUSTOMER', 'ADMIN', 'API'],
      default: 'SYSTEM',
    },

    // Event timestamp (when it occurred)
    eventTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { orderId: 1, sequence: 1 },
      { orderId: 1, eventTimestamp: -1 },
      { agentId: 1, eventTimestamp: -1 },
    ],
  }
);

// Index for tracking sequence per order
deliveryEventSchema.index({ orderId: 1, sequence: 1 });

// Index for time-based queries
deliveryEventSchema.index({ eventTimestamp: -1 });

export default mongoose.model('DeliveryEvent', deliveryEventSchema);
