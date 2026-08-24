import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, enum: ["customer", "admin"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true },
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    orderNumber: { type: String, default: "", index: true },
    category: {
      type: String,
      enum: ["ORDERS", "DELIVERY", "INSTALLATION", "RETURNS", "PAYMENTS", "WARRANTY", "ACCOUNT", "TECHNICAL", "OTHER"],
      required: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    priority: { type: String, enum: ["LOW", "NORMAL", "HIGH", "URGENT"], default: "NORMAL", index: true },
    messages: { type: [ticketMessageSchema], default: () => [] },
  },
  { timestamps: true },
);

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

export default mongoose.model("SupportTicket", supportTicketSchema);
