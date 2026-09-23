import mongoose from "mongoose";
import { DEFAULT_ADMIN_NOTIFICATION_PREFERENCES } from "../constants/notificationTypes.js";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  ...Object.fromEntries(Object.entries(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES).map(([key, value]) => [key, { type: Boolean, default: value }])),
}, { timestamps: true, minimize: false });

export default mongoose.model("AdminNotificationPreference", schema);