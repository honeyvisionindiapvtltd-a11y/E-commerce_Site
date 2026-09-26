import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientType: { type: String, enum: ["customer", "admin", "delivery_agent"], required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    category: { type: String, enum: ["ORDER", "PAYMENT", "DELIVERY", "INSTALLATION", "SUPPORT", "PROMOTION", "PRICE_ALERT", "SECURITY", "CUSTOMER", "PRODUCT", "INVENTORY", "SYSTEM"], default: "SYSTEM", index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    actionUrl: { type: String, default: "", maxlength: 300 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: undefined },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    orderNumber: { type: String, default: "", index: true },
    relatedId: { type: String, default: "" },
    relatedType: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    eventKey: { type: String, default: undefined },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, eventKey: 1 }, { unique: true, sparse: true });

export default mongoose.model("Notification", notificationSchema);