import mongoose from "mongoose";

const deliveryAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    vehicleNumber: {
      type: String,
      default: "",
      trim: true,
    },

    vehicleType: {
      type: String,
      default: "Bike",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    currentLocation: {
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "DeliveryAgent",
  deliveryAgentSchema
);