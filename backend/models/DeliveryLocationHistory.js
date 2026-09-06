import mongoose from 'mongoose';

/**
 * DeliveryLocationHistory - Historical GPS tracking points
 * Stores the complete GPS trail of delivery agents
 * Separate from the current location which is stored in DeliveryAgent.currentLocation
 */
const deliveryLocationHistorySchema = new mongoose.Schema(
  {
    // Delivery agent who provided the location
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Order being delivered
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    // GeoJSON Point location [longitude, latitude]
    // MongoDB 2dsphere index requires this format
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (coords) => {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lon, lat] = coords;
            return Number.isFinite(lon) && Number.isFinite(lat) &&
                   lon >= -180 && lon <= 180 &&
                   lat >= -90 && lat <= 90;
          },
          message: 'Invalid GeoJSON coordinates',
        },
      },
    },

    // GPS accuracy in meters
    accuracy: {
      type: Number,
      min: 0,
      default: null,
    },

    // GPS heading in degrees (0-360)
    heading: {
      type: Number,
      min: 0,
      max: 360,
      default: null,
    },

    // GPS speed in m/s
    speed: {
      type: Number,
      min: 0,
      default: null,
    },

    // Timestamp from GPS device
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },

    // Distance from previous point (meters)
    distanceFromPrevious: {
      type: Number,
      min: 0,
      default: null,
    },

    // Time since previous point (milliseconds)
    timeSincePrevious: {
      type: Number,
      min: 0,
      default: null,
    },

    // Calculated speed between points (m/s)
    calculatedSpeed: {
      type: Number,
      min: 0,
      default: null,
    },

    // Whether this point passed validation
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Validation failure reason if applicable
    validationFailure: {
      type: String,
      default: null,
      enum: [
        null,
        'GPS_JUMP_DETECTED',
        'IMPOSSIBLE_SPEED',
        'POOR_ACCURACY',
        'INVALID_COORDINATES',
        'DUPLICATE',
      ],
    },
  },
  {
    timestamps: true,
    indexes: [
      { agentId: 1, timestamp: -1 },
      { orderId: 1, timestamp: -1 },
      { 'location': '2dsphere' },
    ],
  }
);

// Create 2dsphere index for geospatial queries
deliveryLocationHistorySchema.index({ 'location': '2dsphere' });

// Index for finding history for a specific order and agent combo
deliveryLocationHistorySchema.index({ orderId: 1, agentId: 1, timestamp: -1 });

export default mongoose.model('DeliveryLocationHistory', deliveryLocationHistorySchema);
