import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import useRealtimeUpdates from "../hooks/useRealtimeUpdates.js";
import { clearAllNotifications, deleteNotification as deleteNotificationRequest, getNotificationPreferences, getNotifications, markAllNotificationsRead, markNotificationRead, markNotificationUnread, updateNotificationPreferences } from "../services/notificationService.js";
import { NotificationContext } from "./NotificationContextValue.js";

export function NotificationProvider({ children }) {
  const { isLoggedIn, user, authToken, requestJson } = useAuth();
  const isAdmin = user?.role === "admin";
  const { subscribeToPersistentNotifications, subscribeToNotificationState, getSocket } = useRealtimeUpdates(user?.id || user?._id, authToken);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState({});
  const [preferencesLoadError, setPreferencesLoadError] = useState(null);
  const [preferencesSaveError, setPreferencesSaveError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotificationIds = useRef(new Set());
  const preferencesRef = useRef(null);
  const preferenceRequestIds = useRef({});

  const fetchNotifications = useCallback(async (nextPage = 1) => {
    if (!isLoggedIn) return;
    if (nextPage === 1) setLoading(true); else setLoadingMore(true);
    setError("");
    try {
      const data = await getNotifications(requestJson, nextPage, isAdmin);
      const nextItems = data.notifications || [];
      setNotifications((current) => {
        const merged = nextPage === 1 ? nextItems : [...current, ...nextItems];
        const unique = Array.from(new Map(merged.map((item) => [String(item._id), item])).values());
        seenNotificationIds.current = new Set(unique.map((item) => String(item._id)));
        return unique;
      });
      setUnreadCount(Math.max(0, Number(data.unreadCount) || 0));
      setTotal(Number(data.total) || 0);
      setPage(nextPage);
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isAdmin, isLoggedIn, requestJson]);

  const fetchPreferences = useCallback(async () => {
    if (!isLoggedIn || !["customer", "admin"].includes(user?.role)) return;
    setPreferencesLoading(true);
    setPreferencesLoadError(null);
    try {
      const data = await getNotificationPreferences(requestJson, isAdmin);
      if (!data?.success || !data.preferences) throw new Error("Unable to load notification preferences.");
      setPreferences(data.preferences || {});
      preferencesRef.current = data.preferences || {};
      setPreferencesLoadError(null);
    } catch (requestError) {
      setPreferencesLoadError(requestError.message || "Unable to load notification preferences.");
    } finally {
      setPreferencesLoading(false);
    }
  }, [isAdmin, isLoggedIn, requestJson, user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isLoggedIn) {
        setPreferencesLoadError(null);
        setPreferencesSaveError(null);
        fetchNotifications(1);
        fetchPreferences();
      }
      else {
        seenNotificationIds.current.clear();
        setNotifications([]);
        setUnreadCount(0);
        setPreferences(null);
        preferencesRef.current = null;
        setPreferencesLoading(false);
        setPreferencesLoadError(null);
        setPreferencesSaveError(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn, fetchNotifications, fetchPreferences]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const unsubscribe = subscribeToPersistentNotifications((incomingNotification) => {
      if (!incomingNotification?._id || !incomingNotification.createdAt) return;
      const notificationId = String(incomingNotification._id);
      if (seenNotificationIds.current.has(notificationId)) return;
      seenNotificationIds.current.add(notificationId);
      setNotifications((current) => [incomingNotification, ...current].slice(0, Math.max(30, page * 30)));
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
  }, [isLoggedIn, subscribeToPersistentNotifications, subscribeToNotificationState, getSocket, fetchNotifications, page]);

  const markAsRead = useCallback(async (id) => {
    setActionError(null);
    await markNotificationRead(requestJson, id, isAdmin);
    setNotifications((current) => {
      const item = current.find((notification) => String(notification._id) === String(id));
      if (item?.read) return current;
      if (item) setUnreadCount((count) => Math.max(0, count - 1));
      return current.map((notification) => String(notification._id) === String(id) ? { ...notification, read: true } : notification);
    });
  }, [isAdmin, requestJson]);

  const markAsUnread = useCallback(async (id) => {
    setActionError(null);
    const result = await markNotificationUnread(requestJson, id, isAdmin);
    setNotifications((current) => current.map((notification) => String(notification._id) === String(id) && notification.read ? { ...notification, read: false } : notification));
    if (Number.isFinite(Number(result?.unreadCount))) setUnreadCount(Math.max(0, Number(result.unreadCount)));
  }, [isAdmin, requestJson]);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead(requestJson, isAdmin);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  }, [isAdmin, requestJson]);

  const removeNotification = useCallback(async (id) => {
    await deleteNotificationRequest(requestJson, id, isAdmin);
    setNotifications((current) => {
      const item = current.find((notification) => String(notification._id) === String(id));
      if (item?.read) return current.filter((notification) => String(notification._id) !== String(id));
      if (item) setUnreadCount((count) => Math.max(0, count - 1));
      return current.filter((notification) => String(notification._id) !== String(id));
    });
  }, [isAdmin, requestJson]);

  const clearNotifications = useCallback(async () => {
    await clearAllNotifications(requestJson, isAdmin);
    setNotifications([]);
    setUnreadCount(0);
    setTotal(0);
  }, [isAdmin, requestJson]);

  const savePreference = useCallback(async (key, value) => {
    const previous = preferencesRef.current?.[key];
    const requestId = (preferenceRequestIds.current[key] || 0) + 1;
    preferenceRequestIds.current[key] = requestId;
    setPreferences((current) => ({ ...current, [key]: value }));
    preferencesRef.current = { ...(preferencesRef.current || {}), [key]: value };
    setSavingPreferences((current) => ({ ...current, [key]: true }));
    setPreferencesSaveError(null);
    try {
      const data = await updateNotificationPreferences(requestJson, { [key]: value }, isAdmin);
      if (!data?.success || !data.preferences) throw new Error("Unable to save notification preference.");
      if (preferenceRequestIds.current[key] === requestId) {
        setPreferences((current) => ({ ...current, [key]: data.preferences[key] }));
        preferencesRef.current = { ...(preferencesRef.current || {}), [key]: data.preferences[key] };
      }
      setPreferencesSaveError(null);
      return true;
    } catch (requestError) {
      if (preferenceRequestIds.current[key] === requestId) {
        setPreferences((current) => ({ ...current, [key]: previous }));
        preferencesRef.current = { ...(preferencesRef.current || {}), [key]: previous };
      }
      setPreferencesSaveError(requestError.message || "Unable to save notification preference.");
      return false;
    } finally {
      setSavingPreferences((current) => ({ ...current, [key]: false }));
    }
  }, [isAdmin, requestJson]);

  useEffect(() => {
    const nextTitle = unreadCount > 0 ? `(${unreadCount > 99 ? "99+" : unreadCount}) HoneyVision` : "HoneyVision";
    if (document.title !== nextTitle) document.title = nextTitle;
  }, [unreadCount]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    loadingMore,
    error,
    page,
    total,
    preferences,
    preferencesLoading,
    savingPreferences,
    preferencesLoadError,
    preferencesSaveError,
    actionError,
    adminPreferencesLoading: isAdmin ? preferencesLoading : false,
    adminPreferencesLoadError: isAdmin ? preferencesLoadError : null,
    adminPreferencesSaveError: isAdmin ? preferencesSaveError : null,
    savingAdminPreference: isAdmin ? savingPreferences : {},
    retryPreferences: fetchPreferences,
    fetchNotifications,
    savePreference,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    markAsUnread,
  }), [isAdmin, notifications, unreadCount, loading, loadingMore, error, page, total, preferences, preferencesLoading, savingPreferences, preferencesLoadError, preferencesSaveError, actionError, fetchNotifications, fetchPreferences, savePreference, markAsRead, markAsUnread, markAllAsRead, removeNotification, clearNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}