import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "ChatConversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    senderType: { type: String, enum: ["customer", "agent", "bot", "system"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    messageType: { type: String, enum: ["text", "bot", "system", "quick_reply", "order_status", "agent"], default: "text" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true },
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);