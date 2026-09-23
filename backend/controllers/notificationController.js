import { clearNotifications, deleteNotification, getAdminNotificationPreferences, getCustomerNotificationPreferences, listNotifications, markAllNotificationsRead, markNotificationRead, markNotificationUnread, updateAdminNotificationPreferences, updateCustomerNotificationPreferences } from "../services/notificationService.js";

export const getNotifications = async (req, res) => res.json({ success: true, ...(await listNotifications(req.user, req.query)) });

export const getUnreadCount = async (req, res) => {
  const recipientType = req.user.role === "admin" ? "admin" : req.user.role === "delivery_agent" ? "delivery_agent" : "customer";
  const Notification = (await import("../models/Notification.js")).default;
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, recipientType, read: false });
  return res.json({ success: true, unreadCount });
};

export const readNotification = async (req, res) => {
  const notification = await markNotificationRead(req.user, req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
  return res.json({ success: true, notification });
};

export const readAllNotifications = async (req, res) => {
  await markAllNotificationsRead(req.user);
  return res.json({ success: true, unreadCount: 0 });
};

export const removeNotification = async (req, res) => {
  const notification = await deleteNotification(req.user, req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
  return res.json({ success: true });
};

export const getPreferences = async (req, res) => {
  if (req.user.role === "admin") return res.json({ success: true, preferences: await getAdminNotificationPreferences(req.user) });
  if (req.user.role !== "customer") return res.status(403).json({ success: false, message: "Customer preferences only." });
  return res.json({ success: true, preferences: await getCustomerNotificationPreferences(req.user) });
};

export const patchPreferences = async (req, res) => {
  if (!['customer', 'admin'].includes(req.user.role)) return res.status(403).json({ success: false, message: "Customer or admin preferences only." });
  const updates = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : null;
  if (!updates) return res.status(400).json({ success: false, message: "Preferences must be an object." });
  try {
    const preferences = req.user.role === "admin" ? await updateAdminNotificationPreferences(req.user, updates) : await updateCustomerNotificationPreferences(req.user, updates);
    return res.json({ success: true, preferences });
  } catch (error) {
    if (error?.statusCode === 400) return res.status(400).json({ success: false, message: error.message });
    console.error("Notification preference update failed:", error);
    return res.status(500).json({ success: false, message: "Unable to save notification preferences." });
  }
};

export const clearAllNotifications = async (req, res) => {
  await clearNotifications(req.user);
  return res.json({ success: true, unreadCount: 0 });
};

export const unreadNotification = async (req, res) => {
  const notification = await markNotificationUnread(req.user, req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
  const unreadCount = await listNotifications(req.user, { page: 1, limit: 1 });
  return res.json({ success: true, notification, unreadCount: unreadCount.unreadCount });
};