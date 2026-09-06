import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import useRealtimeUpdates from "../hooks/useRealtimeUpdates.js";
import { deleteNotification as deleteNotificationRequest, getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService.js";
import { getUnreadNotificationCount } from "../services/notificationService.js";
import { NotificationContext } from "./NotificationContextValue.js";

export function NotificationProvider({ children }) {
  const { isLoggedIn, user, authToken, requestJson } = useAuth();
  const { subscribeToPersistentNotifications, subscribeToNotificationState, getSocket } = useRealtimeUpdates(user?.id || user?._id, authToken);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotificationIds = useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await getNotifications(requestJson);
      const nextItems = data.notifications || [];
      seenNotificationIds.current = new Set(nextItems.map((item) => String(item._id)));
      setNotifications(nextItems);
      const unreadData = await getUnreadNotificationCount(requestJson);
      setUnreadCount(Math.max(0, Number(unreadData.unreadCount) || 0));
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, requestJson]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isLoggedIn) fetchNotifications();
      else {
        seenNotificationIds.current.clear();
        setNotifications([]);
        setUnreadCount(0);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn, fetchNotifications]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const unsubscribe = subscribeToPersistentNotifications((incomingNotification) => {
      if (!incomingNotification?._id || !incomingNotification.createdAt) return;
      const notificationId = String(incomingNotification._id);
      if (seenNotificationIds.current.has(notificationId)) return;
      seenNotificationIds.current.add(notificationId);
      setNotifications((current) => [incomingNotification, ...current].slice(0, 30));
      if (!incomingNotification.read) setUnreadCount((count) => count + 1);
    });
    const socket = getSocket();
    const sync = () => fetchNotifications();
    socket?.on("connect", sync);
    const unsubscribeState = subscribeToNotificationState({
      onRead: ({ id }) => setNotifications((current) => {
        const item = current.find((notification) => String(notification._id) === String(id));
        if (item?.read) return current;
        if (item) setUnreadCount((count) => Math.max(0, count - 1));
        return current.map((notification) => String(notification._id) === String(id) ? { ...notification, read: true } : notification);
      }),
      onUnreadCount: ({ unreadCount: nextCount }) => setUnreadCount(Math.max(0, Number(nextCount) || 0)),
    });
    return () => {
      unsubscribe?.();
      unsubscribeState?.();
      socket?.off("connect", sync);
    };
  }, [isLoggedIn, subscribeToPersistentNotifications, subscribeToNotificationState, getSocket, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    await markNotificationRead(requestJson, id);
    setNotifications((current) => {
      const item = current.find((notification) => String(notification._id) === String(id));
      if (item?.read) return current;
      if (item) setUnreadCount((count) => Math.max(0, count - 1));
      return current.map((notification) => String(notification._id) === String(id) ? { ...notification, read: true } : notification);
    });
  }, [requestJson]);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead(requestJson);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  }, [requestJson]);

  const removeNotification = useCallback(async (id) => {
    await deleteNotificationRequest(requestJson, id);
    setNotifications((current) => {
      const item = current.find((notification) => String(notification._id) === String(id));
      if (item?.read) return current.filter((notification) => String(notification._id) !== String(id));
      if (item) setUnreadCount((count) => Math.max(0, count - 1));
      return current.filter((notification) => String(notification._id) !== String(id));
    });
  }, [requestJson]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  }), [notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, removeNotification]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}