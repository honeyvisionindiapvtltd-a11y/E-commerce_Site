import mongoose from "mongoose";
import { ORDER_STATUS_VALUES } from "../constants/orderStatuses.js";

const trackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    completed: {
      type: Boolean,
      default: true,
    },

    source: {
      type: String,
      enum: ["ADMIN", "PAYMENT", "COURIER", "DELIVERY_AGENT", "SYSTEM"],
      default: "SYSTEM",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    _id: true,
  }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  }
);

const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    addressLine1: {
      type: String,
      required: true,
    },

    addressLine2: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    postalCode: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      default: "India",
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      type: addressSchema,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "COD",
        "ONLINE",
        "UPI",
        "CARD",
        "NETBANKING",
      ],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
      ],
      default: "PENDING",
    },

    paymentProvider: {
      type: String,
      default: "",
    },

    paymentTransactionId: {
      type: String,
      default: "",
    },

    paymentOrderId: {
      type: String,
      default: "",
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: "ORDER_PLACED",
      index: true,
    },

    deliveryAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    deliveryAssignedAt: {
      type: Date,
      default: null,
    },

    deliveryStartedAt: {
      type: Date,
      default: null,
    },

    deliveryOtpHash: {
      type: String,
      default: null,
      select: false,
    },

    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    deliveryOtpVerifiedAt: {
      type: Date,
      default: null,
      select: false,
    },

    deliveryOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    deliveryProof: {
      notes: { type: String, default: "", trim: true, maxlength: 1000 },
      capturedAt: { type: Date, default: null },
      capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },

    failedDeliveryReason: {
      type: String,
      default: null,
      enum: [
        null,
        "CUSTOMER_UNAVAILABLE",
        "CUSTOMER_NOT_REACHABLE",
        "ADDRESS_NOT_FOUND",
        "CUSTOMER_REFUSED",
        "OTP_VERIFICATION_FAILED",
        "DELIVERY_LOCATION_UNREACHABLE",
        "CUSTOMER_REQUESTED_RESCHEDULE",
        "OTHER",
      ],
    },

    failedDeliveryNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    failedDeliveryAt: {
      type: Date,
      default: null,
    },

    deliveryLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },

    trackingNumber: {
      type: String,
      default: "",
      index: true,
    },

    courierName: {
      type: String,
      default: "",
    },

    courierCode: {
      type: String,
      default: "",
    },

    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },

    trackingEvents: {
      type: [trackingEventSchema],
      default: [],
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    stockRestoredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);