import { deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService.js";

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