import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const safeNotification = (notification) => notification.toObject ? notification.toObject() : notification;

export async function createNotification({ recipient, recipientType, type, category = "system", title, message, orderId = null, orderNumber = "", relatedId = "", relatedType = "", metadata, actionUrl = "", eventKey = "" }) {
  if (!recipient || !["customer", "admin", "delivery_agent"].includes(recipientType)) return null;
  if (!String(title || "").trim() || !String(message || "").trim()) return null;
  try {
    const notificationData = { recipient, recipientType, type, category, title, message, orderId, orderNumber, relatedId: String(relatedId || ""), relatedType, metadata, actionUrl: String(actionUrl || "").slice(0, 300) };
    const normalizedEventKey = String(eventKey || "").trim();
    if (normalizedEventKey) notificationData.eventKey = normalizedEventKey;
    const notification = await Notification.create(notificationData);
    const payload = safeNotification(notification);
    const { getIO } = await import("./realtimeService.js");
    const io = getIO();
    io?.to(`user:${String(recipient)}`).emit("notification:new", payload);
    if (process.env.NODE_ENV !== "production") console.info(`[Notification] created type=${type} recipientType=${recipientType}`);
    return payload;
  } catch (error) {
    if (error?.code === 11000) {
      if (process.env.NODE_ENV !== "production") console.info(`[Notification] duplicate prevented type=${type}`);
      return null;
    }
    console.error("Notification creation failed:", error.message);
    return null;
  }
}

export const notifyCustomer = (data) => createNotification({ ...data, recipientType: "customer" });
export const notifyAdmin = (data) => createNotification({ ...data, recipientType: "admin" });
export const notifyDeliveryAgent = (data) => createNotification({ ...data, recipientType: "delivery_agent" });

export async function notifyAdmins(data) {
  const admins = await User.find({ role: "admin", status: "Active" }).select("_id").lean();
  return Promise.all(admins.map((admin) => notifyAdmin({ ...data, recipient: admin._id })));
}

export async function listNotifications(user, query = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || 30, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const filter = { recipient: user._id, recipientType: user.role === "admin" ? "admin" : user.role === "delivery_agent" ? "delivery_agent" : "customer" };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);
  return { notifications, total, unreadCount, page, limit };
}

export async function markNotificationRead(user, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const notification = await Notification.findOneAndUpdate({ _id: id, recipient: user._id }, { $set: { read: true, readAt: new Date() } }, { new: true }).lean();
  const { getIO } = await import("./realtimeService.js");
  if (notification) getIO()?.to(`user:${String(user._id)}`).emit("notification:read", { id: String(notification._id) });
  return notification;
}

export async function markAllNotificationsRead(user) {
  const recipientType = user.role === "admin" ? "admin" : user.role === "delivery_agent" ? "delivery_agent" : "customer";
  const result = await Notification.updateMany({ recipient: user._id, recipientType, read: false }, { $set: { read: true, readAt: new Date() } });
  const { getIO } = await import("./realtimeService.js");
  getIO()?.to(`user:${String(user._id)}`).emit("notification:unreadCount", { unreadCount: 0 });
  return result;
}

export async function deleteNotification(user, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Notification.findOneAndDelete({ _id: id, recipient: user._id }).lean();
}