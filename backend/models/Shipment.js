import mongoose from "mongoose";
import { ORDER_STATUS_VALUES } from "../constants/orderStatuses.js";

const trackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      default: "",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    accuracy: {
      type: Number,
      default: null,
    },

    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const shipmentSchema = new mongoose.Schema(
  {
    // ==========================================
    // ORDER
    // ==========================================

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    // ==========================================
    // TRACKING NUMBER
    // ==========================================

    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ==========================================
    // DELIVERY TYPE
    // ==========================================

    deliveryType: {
      type: String,
      enum: [
        "courier",
        "honeyvision",
      ],
      default: "courier",
    },

    // ==========================================
    // COURIER
    // ==========================================

    courierName: {
      type: String,
      default: "",
    },

    courierTrackingUrl: {
      type: String,
      default: "",
    },

    courierAwb: {
      type: String,
      default: "",
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: "ORDER_PLACED",
    },

    // ==========================================
    // ETA
    // ==========================================

    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // CURRENT GPS LOCATION
    // ==========================================

    currentLocation: {
      type: locationSchema,
      default: () => ({}),
    },

    // ==========================================
    // TRACKING HISTORY
    // ==========================================

    trackingEvents: {
      type: [trackingEventSchema],
      default: [],
    },

    // ==========================================
    // DELIVERY AGENT
    // ==========================================

    deliveryAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      default: null,
    },

    // ==========================================
    // LIVE TRACKING
    // ==========================================

    liveTrackingEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Shipment",
  shipmentSchema
);