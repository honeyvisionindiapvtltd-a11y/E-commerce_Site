import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import CustomerNotificationPreference from "../models/CustomerNotificationPreference.js";
import { ADMIN_NOTIFICATION_PREFERENCE_BY_CATEGORY, DEFAULT_ADMIN_NOTIFICATION_PREFERENCES, DEFAULT_NOTIFICATION_PREFERENCES, isNotificationEnabled, normalizeNotificationCategory } from "../constants/notificationTypes.js";
import AdminNotificationPreference from "../models/AdminNotificationPreference.js";

const safeNotification = (notification) => notification.toObject ? notification.toObject() : notification;

export async function createNotification({ recipient, recipientType, type, category = "system", title, message, orderId = null, orderNumber = "", relatedId = "", relatedType = "", metadata, actionUrl = "", eventKey = "" }) {
  if (!recipient || !["customer", "admin", "delivery_agent"].includes(recipientType)) return null;
  if (!String(title || "").trim() || !String(message || "").trim()) return null;
  try {
    const normalizedCategory = normalizeNotificationCategory(category, type);
    if (recipientType === "customer") {
      const preferences = await CustomerNotificationPreference.findOneAndUpdate(
        { user: recipient },
        { $setOnInsert: { user: recipient, ...DEFAULT_NOTIFICATION_PREFERENCES } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();
      if (!isNotificationEnabled(preferences, normalizedCategory, type)) return null;
    }
    if (recipientType === "admin") {
      const preferences = await AdminNotificationPreference.findOneAndUpdate(
        { user: recipient },
        { $setOnInsert: { user: recipient, ...DEFAULT_ADMIN_NOTIFICATION_PREFERENCES } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();
      const preferenceKey = ADMIN_NOTIFICATION_PREFERENCE_BY_CATEGORY[normalizedCategory];
      if (normalizedCategory !== "SECURITY" && preferenceKey && preferences[preferenceKey] === false) return null;
    }
    const notificationData = { recipient, recipientType, type, category: normalizedCategory, title, message, orderId, orderNumber, relatedId: String(relatedId || ""), relatedType, metadata, actionUrl: String(actionUrl || "").slice(0, 300) };
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
  return { notifications: notifications.map((notification) => ({ ...notification, category: normalizeNotificationCategory(notification.category, notification.type) })), total, unreadCount, page, limit };
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

export async function clearNotifications(user) {
  const recipientType = user.role === "admin" ? "admin" : user.role === "delivery_agent" ? "delivery_agent" : "customer";
  const result = await Notification.deleteMany({ recipient: user._id, recipientType });
  const { getIO } = await import("./realtimeService.js");
  getIO()?.to(`user:${String(user._id)}`).emit("notification:unreadCount", { unreadCount: 0 });
  return result;
}

export async function getCustomerNotificationPreferences(user) {
  const preferences = await CustomerNotificationPreference.findOneAndUpdate(
    { user: user._id },
    { $setOnInsert: { user: user._id, ...DEFAULT_NOTIFICATION_PREFERENCES } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return Object.fromEntries(Object.keys(DEFAULT_NOTIFICATION_PREFERENCES).map((key) => [key, key === "securityAlerts" ? true : preferences[key] ?? DEFAULT_NOTIFICATION_PREFERENCES[key]]));
}

export async function updateCustomerNotificationPreferences(user, updates) {
  const allowed = new Set(Object.keys(DEFAULT_NOTIFICATION_PREFERENCES));
  const entries = Object.entries(updates || {});
  const unknownKeys = entries.filter(([key]) => !allowed.has(key)).map(([key]) => key);
  if (unknownKeys.length) throw Object.assign(new Error(`Unknown notification preference: ${unknownKeys[0]}`), { statusCode: 400 });
  const invalidValue = entries.find(([, value]) => typeof value !== "boolean");
  if (invalidValue) throw Object.assign(new Error(`Notification preference ${invalidValue[0]} must be boolean.`), { statusCode: 400 });
  const sanitized = Object.fromEntries(entries);
  sanitized.securityAlerts = true;
  const existing = await CustomerNotificationPreference.findOne({ user: user._id });
  if (existing) {
    Object.assign(existing, sanitized);
    existing.securityAlerts = true;
    await existing.save();
  } else {
    await CustomerNotificationPreference.create({ user: user._id, ...DEFAULT_NOTIFICATION_PREFERENCES, ...sanitized, securityAlerts: true });
  }
  return getCustomerNotificationPreferences(user);
}

export async function getAdminNotificationPreferences(user) {
  let preferences = await AdminNotificationPreference.findOne({ user: user._id }).lean();
  if (!preferences) {
    try {
      preferences = await AdminNotificationPreference.create({ user: user._id, ...DEFAULT_ADMIN_NOTIFICATION_PREFERENCES });
      preferences = preferences.toObject();
    } catch (error) {
      if (error?.code !== 11000) throw error;
      preferences = await AdminNotificationPreference.findOne({ user: user._id }).lean();
    }
  }
  if (!preferences) throw new Error("Admin notification preferences could not be loaded.");
  return Object.fromEntries(Object.keys(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES).map((key) => [key, key === "securityAlerts" ? true : preferences[key] ?? DEFAULT_ADMIN_NOTIFICATION_PREFERENCES[key]]));
}

export async function updateAdminNotificationPreferences(user, updates) {
  const allowed = new Set(Object.keys(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES));
  const entries = Object.entries(updates || {});
  const unknown = entries.find(([key]) => !allowed.has(key));
  if (unknown) throw Object.assign(new Error(`Unknown admin notification preference: ${unknown[0]}`), { statusCode: 400 });
  const invalid = entries.find(([, value]) => typeof value !== "boolean");
  if (invalid) throw Object.assign(new Error(`Admin notification preference ${invalid[0]} must be boolean.`), { statusCode: 400 });
  const existing = await AdminNotificationPreference.findOne({ user: user._id });
  const values = { ...Object.fromEntries(entries), securityAlerts: true };
  if (existing) { Object.assign(existing, values); await existing.save(); }
  else await AdminNotificationPreference.create({ user: user._id, ...DEFAULT_ADMIN_NOTIFICATION_PREFERENCES, ...values });
  return getAdminNotificationPreferences(user);
}

export async function markNotificationUnread(user, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const notification = await Notification.findOneAndUpdate({ _id: id, recipient: user._id }, { $set: { read: false, readAt: null } }, { new: true }).lean();
  const { getIO } = await import("./realtimeService.js");
  if (notification) getIO()?.to(`user:${String(user._id)}`).emit("notification:unreadCount", { unreadCount: await Notification.countDocuments({ recipient: user._id, recipientType: user.role === "admin" ? "admin" : user.role === "delivery_agent" ? "delivery_agent" : "customer", read: false }) });
  return notification;
}