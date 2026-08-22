import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "PICKED_UP", "REFUNDED"],
      default: "REQUESTED",
      index: true,
    },
    refundStatus: { type: String, enum: ["NOT_APPLICABLE", "PENDING", "PROCESSED"], default: "NOT_APPLICABLE" },
    refundAmount: { type: Number, min: 0, default: 0 },
    adminNote: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

returnRequestSchema.index({ order: 1 }, { unique: true });

export default mongoose.model("ReturnRequest", returnRequestSchema);
