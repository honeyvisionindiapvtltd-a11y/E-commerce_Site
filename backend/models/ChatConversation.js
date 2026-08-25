import mongoose from "mongoose";

const chatConversationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["BOT_ACTIVE", "WAITING_FOR_AGENT", "AGENT_ASSIGNED", "RESOLVED", "CLOSED"],
      default: "BOT_ACTIVE",
      index: true,
    },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    relatedOrderNumber: { type: String, default: "", index: true },
    lastMessage: { type: String, default: "", maxlength: 4000 },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    customerUnread: { type: Number, default: 0, min: 0 },
    agentUnread: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

chatConversationSchema.index({ customer: 1, status: 1, updatedAt: -1 });
chatConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model("ChatConversation", chatConversationSchema);